/* @ngInject */
function authProvider() {
    // Default configuration
    var config = {
        rolePropertyName: null,
        permissionPropertyName: null,
        withPermission: false,
        tokenStorage: 'cookie',
        roles: null,
    };

    return {
        // Service configuration
        configure: function (params) {
            angular.extend(config, params);
        },

        // Service itself
        $get: [
            "$q",
            "authService",
            function ($q, authService) {
                if (!config.roles || !Array.isArray(config.roles)) {
                    throw new Error(
                        "roles is a required field and should be is Array."
                    );
                }

                if (!config.rolePropertyName && config.roles.length > 1) {
                    throw new Error(
                        "rolePropertyName is a required field"
                    );
                }
                if (!config.permissionPropertyName && config.withPermission) {
                    throw new Error(
                        "permissionPropertyName is a required field"
                    );
                }

                var init = function () {
                    let authData = authService.getAuthData(config);
                    if (authData) {
                        authService.permissionHandler("signIn", config);
                        authService.uiRouterSync();
                    } else {
                        startLogout();
                    }
                };

                var startSignIn = function (authData, pageHandlerStatus) {

                    if (config.withPermission) {
                        let permissionData = authData[config.permissionPropertyName];
                        authService.savePermissionData(permissionData);
                        delete authData[config.permissionPropertyName];
                    }

                    authService.saveAuthData(authData,config.tokenStorage);

                    authService.permissionHandler("signIn", config);
                    authService.uiRouterSync();
                    if (pageHandlerStatus) {
                        authService.pageStateNameHandler(
                            "signIn",
                            authData[config.rolePropertyName],
                            config
                        );
                    }
                };

                var startLogout = function () {
                    let authData = authService.getAuthData(config);
                    authService.clearAuthData(config.tokenStorage);
                    authService.permissionHandler("logOut");
                    authService.uiRouterSync();
                    authService.pageStateNameHandler("logOut", authData[config.rolePropertyName], config);
                };

                var updateRole = function (newRoleName) {
                    let authData = authService.getAuthData(config);
                    authData[config.rolePropertyName] = newRoleName;
                    authService.saveAuthData(authData,config.tokenStorage);
                    authService.permissionHandler("signIn", config);
                    authService.uiRouterSync();
                    authService.pageStateNameHandler(
                        "signIn",
                        authData[config.rolePropertyName],
                        config
                    );
                };

                var notAuthorized = function () {
                    let authData = authService.getAuthData(config);
                    return authService.notAuthorized(authData, config);
                };

                init();

                return {
                    config: config,

                    isAuthenticated: function () {
                        return authService.hasValidToken();
                    },

                    notAuthorized: function () {
                        return notAuthorized();
                    },

                    signIn: function (authData, pageHandler) {
                        let pageHandlerStatus;
                        if (pageHandler == false) {
                            pageHandlerStatus = false;
                        }
                        else {
                            pageHandlerStatus = true;
                        }

                        let oldData = authService.getAuthData(config);
                        if (oldData) {
                            authService.clearAuthData(config.tokenStorage)
                        }
                        startSignIn(authData, pageHandlerStatus);
                    },

                    logOut: function () {
                        startLogout();
                    },

                    user: function () {
                        return authService.getAuthData(config);
                    },

                    updateRole: function (newRoleName) {
                        if (!newRoleName) {
                            throw new Error(
                                "newRoleName is a required field For updateRole()"
                            );
                        }
                        else {
                            updateRole(newRoleName);
                        }
                    }
                };
            }
        ]
    };
}

export {
    authProvider
}
