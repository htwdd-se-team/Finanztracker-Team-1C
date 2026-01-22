'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">backend documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-daa4565a6a5e449a1ffe01b02ff14a52ee0bd6c281916020571eeff07d1b16be1faed220aade5bcdd226779c7c829adcddf5b66d71b6cf8a148b8f87d540d5b6"' : 'data-bs-target="#xs-controllers-links-module-AppModule-daa4565a6a5e449a1ffe01b02ff14a52ee0bd6c281916020571eeff07d1b16be1faed220aade5bcdd226779c7c829adcddf5b66d71b6cf8a148b8f87d540d5b6"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-daa4565a6a5e449a1ffe01b02ff14a52ee0bd6c281916020571eeff07d1b16be1faed220aade5bcdd226779c7c829adcddf5b66d71b6cf8a148b8f87d540d5b6"' :
                                            'id="xs-controllers-links-module-AppModule-daa4565a6a5e449a1ffe01b02ff14a52ee0bd6c281916020571eeff07d1b16be1faed220aade5bcdd226779c7c829adcddf5b66d71b6cf8a148b8f87d540d5b6"' }>
                                            <li class="link">
                                                <a href="controllers/AnalyticsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnalyticsController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/CategoryController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoryController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/DemoController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DemoController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/EntryController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EntryController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/FilterController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilterController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/UserController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-daa4565a6a5e449a1ffe01b02ff14a52ee0bd6c281916020571eeff07d1b16be1faed220aade5bcdd226779c7c829adcddf5b66d71b6cf8a148b8f87d540d5b6"' : 'data-bs-target="#xs-injectables-links-module-AppModule-daa4565a6a5e449a1ffe01b02ff14a52ee0bd6c281916020571eeff07d1b16be1faed220aade5bcdd226779c7c829adcddf5b66d71b6cf8a148b8f87d540d5b6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-daa4565a6a5e449a1ffe01b02ff14a52ee0bd6c281916020571eeff07d1b16be1faed220aade5bcdd226779c7c829adcddf5b66d71b6cf8a148b8f87d540d5b6"' :
                                        'id="xs-injectables-links-module-AppModule-daa4565a6a5e449a1ffe01b02ff14a52ee0bd6c281916020571eeff07d1b16be1faed220aade5bcdd226779c7c829adcddf5b66d71b6cf8a148b8f87d540d5b6"' }>
                                        <li class="link">
                                            <a href="injectables/AnalyticsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnalyticsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CategoryService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoryService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DemoService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DemoService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/EntryService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EntryService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FilterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilterService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ImportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ImportService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtAuthGuard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtAuthGuard</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/KyselyService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KyselyService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PrismaService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PrismaService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RecurringEntryService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecurringEntryService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#controllers-links"' :
                                'data-bs-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/AnalyticsController.html" data-type="entity-link" >AnalyticsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/AppController.html" data-type="entity-link" >AppController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/AuthController.html" data-type="entity-link" >AuthController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/CategoryController.html" data-type="entity-link" >CategoryController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/DemoController.html" data-type="entity-link" >DemoController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/EntryController.html" data-type="entity-link" >EntryController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/FilterController.html" data-type="entity-link" >FilterController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UserController.html" data-type="entity-link" >UserController</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AvailableCapitalItemDto.html" data-type="entity-link" >AvailableCapitalItemDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/BackendConfig.html" data-type="entity-link" >BackendConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryPaginationParamsDto.html" data-type="entity-link" >CategoryPaginationParamsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryResponseDto.html" data-type="entity-link" >CategoryResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateCategoryDto.html" data-type="entity-link" >CreateCategoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateEntryDto.html" data-type="entity-link" >CreateEntryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateFilterDto.html" data-type="entity-link" >CreateFilterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/EntryPageDto.html" data-type="entity-link" >EntryPageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/EntryPaginationParamsDto.html" data-type="entity-link" >EntryPaginationParamsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/EntryResponseDto.html" data-type="entity-link" >EntryResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterParamsDto.html" data-type="entity-link" >FilterParamsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterResponseDto.html" data-type="entity-link" >FilterResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FirstTransactionDateDto.html" data-type="entity-link" >FirstTransactionDateDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginResponseDto.html" data-type="entity-link" >LoginResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/MaxValueDto.html" data-type="entity-link" >MaxValueDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationDto.html" data-type="entity-link" >PaginationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterDto.html" data-type="entity-link" >RegisterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledEntriesParamsDto.html" data-type="entity-link" >ScheduledEntriesParamsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledEntriesResponseDto.html" data-type="entity-link" >ScheduledEntriesResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledEntriesSummaryDto.html" data-type="entity-link" >ScheduledEntriesSummaryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledEntriesSummaryParamsDto.html" data-type="entity-link" >ScheduledEntriesSummaryParamsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledMonthlyParamsDto.html" data-type="entity-link" >ScheduledMonthlyParamsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledMonthlyTotalDto.html" data-type="entity-link" >ScheduledMonthlyTotalDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledMonthlyTotalsResponseDto.html" data-type="entity-link" >ScheduledMonthlyTotalsResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransactionBalanceHistoryParamsDto.html" data-type="entity-link" >TransactionBalanceHistoryParamsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransactionBreakdownItemDto.html" data-type="entity-link" >TransactionBreakdownItemDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransactionBreakdownParamsDto.html" data-type="entity-link" >TransactionBreakdownParamsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransactionBreakdownResponseDto.html" data-type="entity-link" >TransactionBreakdownResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransactionItemDto.html" data-type="entity-link" >TransactionItemDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateCategoryDto.html" data-type="entity-link" >UpdateCategoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateEmergencyReserveDto.html" data-type="entity-link" >UpdateEmergencyReserveDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateEntryDto.html" data-type="entity-link" >UpdateEntryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateFilterDto.html" data-type="entity-link" >UpdateFilterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserBalanceResponseDto.html" data-type="entity-link" >UserBalanceResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserResponseDto.html" data-type="entity-link" >UserResponseDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AnalyticsService.html" data-type="entity-link" >AnalyticsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AppService.html" data-type="entity-link" >AppService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CategoryService.html" data-type="entity-link" >CategoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoService.html" data-type="entity-link" >DemoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntryService.html" data-type="entity-link" >EntryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilterService.html" data-type="entity-link" >FilterService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImportService.html" data-type="entity-link" >ImportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtAuthGuard.html" data-type="entity-link" >JwtAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtStrategy.html" data-type="entity-link" >JwtStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/KyselyService.html" data-type="entity-link" >KyselyService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PrismaService.html" data-type="entity-link" >PrismaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RecurringEntryService.html" data-type="entity-link" >RecurringEntryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/DemoCategory.html" data-type="entity-link" >DemoCategory</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DemoTransaction.html" data-type="entity-link" >DemoTransaction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestUser.html" data-type="entity-link" >TestUser</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});