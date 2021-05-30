<template>
    <footer v-if="config.header">
        <Separator icon="user-friends"/>
        <div class="d-flex flex-column flex-md-row justify-content-around mt-4 mb-5">
            <div class="small text-center d-flex flex-column justify-content-center">
                <p class="mb-2">
                    <T>contact.authors</T>:
                </p>

                <Authors/>

                <p>
                    <T>footer.license</T>
                </p>
            </div>
            <div class="text-center d-flex flex-column justify-content-center">
                <div v-if="config.contact.legal" class="small">
                    <router-link :to="`/${config.contact.legal.route}`">
                        <Icon v="collective-logo.svg"/>
                        <T>contact.legal.name</T>
                    </router-link>
                    <ul>
                        <li v-for="(value, name) in $t('contact.legal.numbers')" class="list-unstyled">
                            <strong>{{name}}:</strong> {{value}}
                        </li>
                    </ul>
                </div>
                <p class="small mb-0">
                    <Icon v="users"/>
                    <T>footer.links</T>:
                </p>
                <div class="mb-3" :class="['d-flex', config.links.socials.length > 2 ? 'flex-column' : 'flex-row']">
                    <span>
                        <SquareButton
                                v-for="link in [...config.contact.contacts, ...config.links.socials]" :key="link.url"
                                :link="link.url"
                                :aria-label="link.icon"
                        >
                            <Icon :v="link.icon" :set="link.iconSet || 'l'"/>
                        </SquareButton>
                    </span>
                    <span><Spaceless>
                        <SquareButton link="https://avris.it" aria-label="avris.it">
                            <img src="~assets/avris.svg" alt="Avris"/>
                        </SquareButton>
                        <Clipboardable v-for="s in config.support.links" :key="s.url" :message="s.clipboard">
                            <SquareButton :link="s.url" :aria-label="s.headline">
                                <Icon :v="s.icon" :set="s.iconSet || 'l'"/>
                            </SquareButton>
                        </Clipboardable>
                        <SquareButton link="https://gitlab.com/Avris/Zaimki" aria-label="GitLab">
                            <Icon v="gitlab" set="b"/>
                        </SquareButton>
                    </Spaceless></span>
                </div>
                <ul v-if="config.user.enabled" class="list-inline small">
                    <li class="list-inline-item">
                        <nuxt-link :to="`/${config.user.termsRoute}`">
                            <Icon v="gavel"/>
                            <T>terms.header</T>
                        </nuxt-link>
                    </li>
                    <li class="list-inline-item">
                        <nuxt-link v-if="config.api !== null" to="/api">
                            <Icon v="laptop-code"/>
                            <T>api.header</T>
                        </nuxt-link>
                        <LocaleLink v-else locale="en" link="/api">
                            <Icon v="laptop-code"/>
                            <T>api.header</T>
                        </LocaleLink>
                    </li>
                </ul>
                <ul v-if="config.user.enabled" class="list-inline small">
                    <li class="list-inline-item">
                        <LocaleLink locale="en" link="/blog/creating-new-language-version">
                            <Icon v="language"/>
                            <T>localise.short</T>
                        </LocaleLink>
                    </li>
                </ul>
                <Share/>
            </div>
        </div>
    </footer>
</template>
