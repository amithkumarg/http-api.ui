(function() {
    'use strict';

    angular
        .module('api')
        .controller('apiController', apiController);

    apiController.$inject = ['$anchorScroll', '$scope', '$state', '$stateParams', '$timeout', 'api'];
    
    function apiController($anchorScroll, $scope, $state, $stateParams, $timeout, api) {
        var vm = this;
        var options = {
            specListUrl: 'specs.json',
            apiContainerSelector: '.api-container',
            jsonTabSize: 2,
            stateChangeOptions: {
                notify: false,
                reload: false
            },
            stateChangeOptionsWithOverride: {
                location: 'replace',
                notify: false,
                reload: false
            }
        };

        vm.copyObject = copyObject;
        vm.hideSchemas = false;
        vm.isBodyList = isBodyList;
        vm.isEmptyObject = isEmptyObject;
        vm.isExpandable = isExpandable;
        vm.isParameterList = isParameterList;
        vm.isString = isString;
        vm.loading = false;
        vm.scrollToMethod = scrollToMethod;
        vm.scrollToSchema = scrollToSchema;
        vm.slugify = slugify;
        vm.spec = null;
        vm.specList = null;
        vm.specUrl = null;
        vm.specName = null;
        vm.toggleFirstResponse = toggleFirstResponse;
        vm.toggleParameterType = toggleParameterType;
        vm.toggleResponse = toggleResponse;
        vm.transformItemsToProperties = transformItemsToProperties;

        activate();

        function activate() {
            $anchorScroll.yOffset = parseInt(angular.element(options.apiContainerSelector).css('padding-top'));
            getApiList();
        }

        function getApiList() {
            if (vm.loding) return;

            vm.loading = true;

            api.get(options.specListUrl)
            .then(function(response) {
                vm.specList = response;

                if (vm.specList.length) {
                    if (!!$stateParams.spec) {
                        var spec = $stateParams.spec.toLowerCase();

                        for (var i = 0, len = vm.specList.length; i < len; i++) {
                            if (vm.slugify(vm.specList[i].name) === spec) {
                                vm.specUrl = vm.specList[i].path;
                                vm.specName = vm.specList[i].name;
                                break;
                            }
                        }
                    }

                    if (!vm.specUrl) {
                        vm.specUrl = vm.specList[0].path;
                        vm.specName = vm.specList[0].name;
                    }

                    $scope.$watch('vm.specUrl', function(newVal, oldVal) {
                        getApiSpecificicationJson(newVal);

                        for (var i = 0, len = vm.specList.length; i < len; i++) {
                            if (vm.specList[i].path === newVal) {
                                vm.specName = vm.specList[i].name;

                                $state.go('apiDeeplink', {
                                    spec: vm.slugify(vm.specName)
                                }, options.stateChangeOptionsWithOverride);

                                break;
                            }
                        }
                    });
                } else {
                    alert('No API specifications found.');
                    vm.loading = false;
                }
            }, function(response) {
                alert('An error occurred while retrieving the list of API specifications');
                vm.loading = false;
            });
        }

        function getApiSpecificicationJson(url) {
            if (vm.loding) return;

            vm.loading = true;
            vm.spec = null;

            $timeout(function() {
                api.get(url)
                .then(function(response) {
                    vm.spec = response;

                    if (!!$stateParams.section) {
                        _scrollToSection($stateParams.section);
                    }
                }, function(response) {
                    alert('An error occurred while retrieving API specifications from ' + url);
                })['finally'](function() {
                    vm.loading = false;
                });
            });
        }

        function isBodyList(requestType) {
            return requestType.toLowerCase() === 'body';
        }

        function copyObject(obj) {
            return angular.copy(obj);
        }

        function isEmptyObject(obj) {
            return angular.equals({}, obj);
        }

        function isExpandable(property) {
            return ((property.value.type === 'object' || property.value.type === 'array')
                && ((property.value.properties && property.value.properties.length) || (property.value.items && property.value.items.length)))
                || (property.value.criteria && property.value.criteria.length)
                || (property.value.examples && property.value.examples.length)
                || property.value.ref
                || (property.value.format && property.value.format.ref);
        }
        
        function isParameterList(requestType) {
            return ['path', 'query', 'header'].indexOf(requestType.toLowerCase()) !== -1;
        }

        function isString(input) {
            return typeof input === 'string';
        }

        function scrollToMethod(section, method, overrideState) {
            var id = section.name;
            section.__hide = false;
            
            if (method) {
                id += '-' + method.method + '-' + method.location;
                method.__hide = false;
            }
            
            $state.go('apiDeeplink', {
                spec: vm.slugify(vm.specName),
                section: vm.slugify(id)
            }, overrideState ? options.stateChangeOptionsWithOverride : options.stateChangeOptions);

            $timeout(function() {
                $anchorScroll(vm.slugify(id));
            });
        }

        function scrollToSchema(name, overrideState) {
            if (!name) {
                return;
            }

            var slug = 'schemas';
            vm.hideSchemas = false;

            if (name && vm.spec.schemas.json[name]) {
                vm.spec.schemas.json[name].__show = true;
                slug = 'schema-' + vm.slugify(name);
            }

            $state.go('apiDeeplink', {
                spec: vm.slugify(vm.specName),
                section: slug
            }, overrideState ? options.stateChangeOptionsWithOverride : options.stateChangeOptions);

            $timeout(function() {
                $anchorScroll(slug);
            });
        }

        function slugify(str) {
            return str.toString().toLowerCase()
                .replace(/\s+/g, '-')       // Replace spaces with -
                .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
                .replace(/\-\-+/g, '-')     // Replace multiple - with single -
                .replace(/^-+/, '')         // Trim - from start of text
                .replace(/-+$/, '');        // Trim - from end of text
        }

        function toggleFirstResponse(index, responses, response) {
            if (index === 0) {
                vm.toggleResponse(responses, response);
            }
        }

        function toggleParameterType(requestObj, requestType) {
            for (var key in requestObj) {
                if (requestObj.hasOwnProperty(key)) {
                    requestObj[key].__hide = true;
                }
            }

            requestObj[requestType].__hide = false;
        }

        function toggleResponse(responses, response) {
            responses.map(function(response) {
                response.__hide = true;
            });

            response.__hide = false;
        }

        function transformItemsToProperties(items) {
            return items.map(function(item) {
                item.isArrayIndex = true;
                item.key = item.index;
                return item;
            });
        }

        function _scrollToSection(section) {
            section = section.toLowerCase();

            var schemas = [];
            for (var key in vm.spec.schemas.json) {
                if (vm.spec.schemas.json.hasOwnProperty(key) && ('schema-' + vm.slugify(key)) === section) {
                    vm.scrollToSchema(key, true);
                    return;
                }
            }
            
            for (var i = 0, len = vm.spec.sections.length; i < len; i++) {
                if (vm.slugify(vm.spec.sections[i].name) === section) {
                    vm.scrollToMethod(vm.spec.sections[i], null, true);
                    return;
                }
            }

            for (var j = 0, lenJ = vm.spec.sections.length; j < lenJ; j++) {
                for (var k = 0, lenK = vm.spec.sections[j].methods.length; k < lenK; k++) {
                    if (vm.slugify(vm.spec.sections[j].name + '-' + vm.spec.sections[j].methods[k]) === section && vm.spec.methods[vm.spec.sections[j].methods[k]]) {
                        vm.scrollToMethod(vm.spec.sections[j], vm.spec.methods[vm.spec.sections[j].methods[k]], true);
                        return;
                    }
                }
            }
        }
    }
})();