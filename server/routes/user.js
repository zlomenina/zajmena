import { Router } from 'express';
import SQL from 'sql-template-strings';
import {ulid} from "ulid";
import {buildDict, makeId, now} from "../../src/helpers";
import jwt from "../../src/jwt";
import mailer from "../../src/mailer";
import { loadSuml } from '../loader';
import avatar from '../avatar';
import { config as socialLoginConfig, handlers as socialLoginHandlers } from '../social';
import cookieSettings from "../../src/cookieSettings";

const config = loadSuml('config');
const translations = loadSuml('translations');

const USERNAME_CHARS = 'A-Za-zĄĆĘŁŃÓŚŻŹąćęłńóśżź0-9._-';

const normalise = s => s.trim().toLowerCase();

const saveAuthenticator = async (db, type, user, payload, validForMinutes = null) => {
    const id = ulid();
    await db.get(SQL`INSERT INTO authenticators (id, userId, type, payload, validUntil) VALUES (
        ${id},
        ${user ? user.id : null},
        ${type},
        ${JSON.stringify(payload)},
        ${validForMinutes ? (now() + validForMinutes * 60) : null}
    )`);
    return id;
}

const findAuthenticator = async (db, id, type) => {
    const authenticator = await db.get(SQL`SELECT * FROM authenticators
        WHERE id = ${id}
        AND type = ${type}
        AND (validUntil IS NULL OR validUntil > ${now()})
    `);

    if (authenticator) {
        authenticator.payload = JSON.parse(authenticator.payload);
    }

    return authenticator
}

const invalidateAuthenticator = async (db, id) => {
    await db.get(SQL`UPDATE authenticators
        SET validUntil = ${now()}
        WHERE id = ${id}
    `);
}

const defaultUsername = async (db, email) => {
    const base = email.substring(0, email.includes('@') ? email.indexOf('@') : email.length)
        .padEnd(4, '0')
        .substring(0, 14)
        .replace(new RegExp(`[^${USERNAME_CHARS}]`, 'g'), '_');

    let c = 0;
    while (true) {
        let proposal = base + (c || '');
        let dbUser = await db.get(SQL`SELECT id FROM users WHERE lower(trim(replace(replace(replace(replace(replace(replace(replace(replace(replace(username, 'Ą', 'ą'), 'Ć', 'ć'), 'Ę', 'ę'), 'Ł', 'ł'), 'Ń', 'ń'), 'Ó', 'ó'), 'Ś', 'ś'), 'Ż', 'ż'), 'Ź', 'ż'))) = ${normalise(proposal)}`);
        if (!dbUser) {
            return proposal;
        }
        c++;
    }
}

const fetchOrCreateUser = async (db, user, avatarSource = 'gravatar') => {
    let dbUser = await db.get(SQL`SELECT * FROM users WHERE email = ${normalise(user.email)}`);
    if (!dbUser) {
        dbUser = {
            id: ulid(),
            username: await defaultUsername(db, user.name || user.email),
            email: normalise(user.email),
            roles: '',
            avatarSource: avatarSource,
        }
        await db.get(SQL`INSERT INTO users(id, username, email, roles, avatarSource)
            VALUES (${dbUser.id}, ${dbUser.username}, ${dbUser.email}, ${dbUser.roles}, ${dbUser.avatarSource})`)
    }

    dbUser.avatar = await avatar(db, dbUser);

    return dbUser;
}

const issueAuthentication = async (db, user) => {
    const dbUser = await fetchOrCreateUser(db, user);

    return jwt.sign({
        ...dbUser,
        authenticated: true,
    });
}

const validateEmail = async (email) => {
    email = String(email).toLowerCase();
    if (email.endsWith('.oauth')) {
        return;
    }
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(email)) {
        return false;
    }
    const { Resolver } = require('dns').promises;
    const dns = new Resolver();
    try {
        const addresses = await dns.resolveMx(email.split('@')[1]);
        return addresses.length > 0;
    } catch {
        return false;
    }
}

const reloadUser = async (req, res, next) => {
    if (!req.user) {
        next();
        return;
    }

    const dbUser = await req.db.get(SQL`SELECT * FROM users WHERE id = ${req.user.id}`);

    if (!dbUser) {
        res.clearCookie('token');
        next();
        return;
    }

    if (req.user.username !== dbUser.username
        || req.user.email !== dbUser.email
        || req.user.roles !== dbUser.roles
        || req.user.avatarSource !== dbUser.avatarSource
    ) {
        const newUser = {
            ...dbUser,
            authenticated: true,
            avatar: await avatar(req.db, dbUser),
        };
        const token = jwt.sign(newUser);
        res.cookie('token', token, cookieSettings);
        req.user = {...req.user, ...newUser};
    }
    next();
}

const router = Router();

router.use(reloadUser);

router.post('/user/init', async (req, res) => {
    let user = undefined;
    let usernameOrEmail = req.body.usernameOrEmail;

    const isEmail = usernameOrEmail.indexOf('@') > -1;
    let isTest = false;

    if (process.env.NODE_ENV === 'development' && usernameOrEmail.endsWith('+')) {
        isTest = true;
        usernameOrEmail = usernameOrEmail.substring(0, usernameOrEmail.length - 1);
    }

    if (isEmail) {
        user = await req.db.get(SQL`SELECT * FROM users WHERE email = ${normalise(usernameOrEmail)}`);
    } else {
        user = await req.db.get(SQL`SELECT * FROM users WHERE lower(trim(replace(replace(replace(replace(replace(replace(replace(replace(replace(username, 'Ą', 'ą'), 'Ć', 'ć'), 'Ę', 'ę'), 'Ł', 'ł'), 'Ń', 'ń'), 'Ó', 'ó'), 'Ś', 'ś'), 'Ż', 'ż'), 'Ź', 'ż'))) = ${normalise(usernameOrEmail)}`);
    }

    if (!user && !isEmail) {
        return res.json({error: 'user.login.userNotFound'})
    }

    const payload = {
        username: isEmail ? (user ? user.username : null) : usernameOrEmail,
        email: isEmail ? normalise(usernameOrEmail) : user.email,
        code: isTest ? '999999' : makeId(6, '0123456789'),
    }

    if (!await validateEmail(payload.email)) {
        return res.json({ error: 'user.account.changeEmail.invalid' })
    }

    const codeKey = await saveAuthenticator(req.db, 'email', user, payload, 15);

    if (!isTest) {
        mailer(
            payload.email,
            `[${translations.title}] ${translations.user.login.email.subject.replace('%code%', payload.code)}`,
            translations.user.login.email.content.replace('%code%', payload.code),
        )
    }

    return res.json({
        token: jwt.sign({...payload, code: null, codeKey}, '15m'),
    });
});

router.post('/user/validate', async (req, res) => {
    if (!req.rawUser || !req.rawUser.codeKey) {
        return res.json({error: 'user.tokenExpired'});
    }

    const authenticator = await findAuthenticator(req.db, req.rawUser.codeKey, 'email');
    if (!authenticator) {
        return res.json({error: 'user.tokenExpired'});
    }

    if (authenticator.payload.code !== normalise(req.body.code)) {
        return res.json({error: 'user.code.invalid'});
    }

    await invalidateAuthenticator(req.db, authenticator);

    return res.json({token: await issueAuthentication(req.db, req.rawUser)});
});

router.post('/user/change-username', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({error: 'Unauthorised'});
    }

    if (req.body.username.length < 4 || req.body.username.length > 16 || !req.body.username.match(new RegExp(`^[${USERNAME_CHARS}]+$`))) {
        return { error: 'user.account.changeUsername.invalid' }
    }

    const dbUser = await req.db.get(SQL`SELECT * FROM users WHERE lower(trim(replace(replace(replace(replace(replace(replace(replace(replace(replace(username, 'Ą', 'ą'), 'Ć', 'ć'), 'Ę', 'ę'), 'Ł', 'ł'), 'Ń', 'ń'), 'Ó', 'ó'), 'Ś', 'ś'), 'Ż', 'ż'), 'Ź', 'ż'))) = ${normalise(req.body.username)}`);
    if (dbUser) {
        return res.json({ error: 'user.account.changeUsername.taken' })
    }

    await req.db.get(SQL`UPDATE users SET username = ${req.body.username} WHERE id = ${req.user.id}`);

    return res.json({token: await issueAuthentication(req.db, req.user)});
});

router.post('/user/change-email', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({error: 'Unauthorised'});
    }

    if (!await validateEmail(req.user.email)) {
        return res.json({ error: 'user.account.changeEmail.invalid' })
    }

    const dbUser = await req.db.get(SQL`SELECT * FROM users WHERE lower(trim(email)) = ${normalise(req.body.email)}`);
    if (dbUser) {
        return res.json({ error: 'user.account.changeEmail.taken' })
    }

    if (!req.body.authId) {
        const payload = {
            from: req.user.email,
            to: normalise(req.body.email),
            code: makeId(6, '0123456789'),
        };

        const authId = await saveAuthenticator(req.db, 'changeEmail', req.user, payload, 15);

        mailer(
            payload.to,
            `[${translations.title}] ${translations.user.login.email.subject.replace('%code%', payload.code)}`,
            translations.user.login.email.content.replace('%code%', payload.code),
        )

        return res.json({ authId });
    }

    const authenticator = await findAuthenticator(req.db, req.body.authId, 'changeEmail');
    if (!authenticator) {
        return res.json({error: 'user.tokenExpired'});
    }

    if (authenticator.payload.code !== normalise(req.body.code)) {
        return res.json({error: 'user.code.invalid'});
    }

    await invalidateAuthenticator(req.db, authenticator);

    await req.db.get(SQL`UPDATE users SET email = ${authenticator.payload.to} WHERE id = ${req.user.id}`);
    req.user.email = authenticator.payload.to;

    return res.json({token: await issueAuthentication(req.db, req.user)});
});

router.post('/user/delete', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({error: 'Unauthorised'});
    }

    await req.db.get(SQL`DELETE FROM profiles WHERE userId = ${req.user.id}`)
    await req.db.get(SQL`DELETE FROM authenticators WHERE userId = ${req.user.id}`)
    await req.db.get(SQL`DELETE FROM users WHERE id = ${req.user.id}`)

    return res.json(true);
});

router.post('/user/:id/set-roles', async (req, res) => {
    if (!req.isGranted('*')) {
        return res.status(401).json({error: 'Unauthorised'});
    }

    await req.db.get(SQL`UPDATE users SET roles = ${req.body.roles} WHERE id = ${req.params.id}`);

    return res.json('ok');
});

router.get('/user/social/:provider', async (req, res) => {
    if (!req.session.grant || !req.session.grant.response || !req.session.grant.response.access_token || !socialLoginHandlers[req.params.provider]) {
        return res.status(400).redirect('/' + config.user.route);
    }

    const payload = socialLoginHandlers[req.params.provider](req.session.grant.response)

    const auth = await req.db.get(SQL`
        SELECT * FROM authenticators
        WHERE type = ${req.params.provider}
        AND payload LIKE ${'{"id":"' + payload.id + '"%'}
        AND (validUntil IS NULL OR validUntil > ${now()})
    `)

    const user = auth ? await req.db.get(SQL`
        SELECT * FROM users
        WHERE id = ${auth.userId}
    `) : req.user;

    const dbUser = await fetchOrCreateUser(req.db, user || {
        email: payload.email || `${payload.id}@${req.params.provider}.oauth`,
        name: payload.name,
    }, req.params.provider);

    const token = jwt.sign({
        ...dbUser,
        authenticated: true,
    });

    if (auth) {
        await invalidateAuthenticator(req.db, auth.id);
    }
    await saveAuthenticator(req.db, req.params.provider, dbUser, payload);

    return res.cookie('token', token).redirect('/' + config.user.route);
});

router.get('/user/social-connections', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({error: 'Unauthorised'});
    }

    const authenticators = await req.db.all(SQL`
        SELECT type, payload FROM authenticators
        WHERE type IN (`.append(Object.keys(socialLoginConfig).map(k => `'${k}'`).join(',')).append(SQL`)
        AND userId = ${req.user.id}
        AND (validUntil IS NULL OR validUntil > ${now()})
    `));

    return res.json(buildDict(function* () {
        for (let auth of authenticators) {
            yield [auth.type, JSON.parse(auth.payload)];
        }
    }));
});

router.post('/user/social-connection/:provider/disconnect', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({error: 'Unauthorised'});
    }

    const auth = await req.db.get(SQL`
        SELECT id FROM authenticators
        WHERE type = ${req.params.provider}
        AND userId = ${req.user.id}
        AND (validUntil IS NULL OR validUntil > ${now()})
    `)

    await invalidateAuthenticator(req.db, auth.id)

    return res.json('ok');
});

router.post('/user/set-avatar', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({error: 'Unauthorised'});
    }

    await req.db.get(SQL`
        UPDATE users
        SET avatarSource = ${req.body.source || null}
        WHERE id = ${req.user.id}
    `)

    return res.json({token: await issueAuthentication(req.db, req.user)});
});

export default router;
