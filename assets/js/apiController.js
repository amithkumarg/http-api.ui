(function(){
    'use strict';

    angular
        .module('api')
        .controller('apiController', apiController);

    apiController.$inject = ['$anchorScroll', '$scope', '$timeout', 'api'];
    
    function apiController($anchorScroll, $scope, $timeout, api) {
        var vm = this;
        var options = {
            specListUrl: 'specs.json',
            apiContainerSelector: '.api-container',
            jsonTabSize: 2
        };

        vm.hideSchemas = false;
        vm.isBodyList = isBodyList;
        vm.isEmptyObject = isEmptyObject;
        vm.isParameterList = isParameterList;
        vm.isRegEx = isRegEx;
        vm.isString = isString;
        vm.loading = false;
        vm.prettifyJsonObject = prettifyJsonObject;
        vm.scrollToMethod = scrollToMethod;
        vm.scrollToSchema = scrollToSchema;
        vm.slugify = slugify;
        vm.spec = null;
        vm.specList = null;
        vm.specUrl = null;
        vm.toggleFirstParameterType = toggleFirstParameterType;
        vm.toggleFirstResponse = toggleFirstResponse;
        vm.toggleParameterType = toggleParameterType;
        vm.toggleResponse = toggleResponse;

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
                    vm.specUrl = vm.specList[0].path;

                    $scope.$watch('vm.specUrl', function(newVal, oldVal) {
                        getApiSpecificicationJson(newVal);
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

            $timeout(function(){
                api.get(url)
                .then(function(response) {
                    vm.spec = response;
                }, function(response) {
                    alert('An error occurred while retrieving API specifications from ' + url);
                })['finally'](function() {
                    vm.loading = false;
                });
            }, 500);
        }

        function isBodyList(requestType) {
            return requestType.toLowerCase() === 'body';
        }
        
        function isEmptyObject(obj) {
            return angular.equals({}, obj);
        }
        
        function isParameterList(requestType) {
            return ['path', 'query', 'header'].indexOf(requestType.toLowerCase()) !== -1;
        }

        function isRegEx(input) {
            if (!input || typeof input !== 'string' || input.length === 0) {
                return false;
            }

            return input[0] === '/' && input[input.length - 1] === '/';
        }

        function isString(input) {
            return typeof input === 'string';
        }

        function prettifyJsonObject(obj) {
            return JSON.stringify(obj, null, options.jsonTabSize);
        }

        function scrollToMethod(section, method) {
            var id = section.name;
            section.__hide = false;
            
            if (method) {
                id += '-' + method.method + '-' + method.location;
                method.__hide = false;
            }
            
            $timeout(function(){
                $anchorScroll(vm.slugify(id));
            });
        }

        function scrollToSchema(name) {
            if (!name) {
                return;
            }

            var slug = 'schemas';
            vm.hideSchemas = false;

            if (name && vm.spec.schemas.json[name]) {
                vm.spec.schemas.json[name].__show = true;
                slug = 'schema-' + vm.slugify(name);
            }

            $timeout(function(){
                $anchorScroll(slug);
            });
        }

        function slugify(str) {
            return str.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
        }

        function toggleFirstParameterType(index, requestObj, requestType) {
            if (index === 0) {
                vm.toggleParameterType(requestObj, requestType);
            }
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
    }
})();