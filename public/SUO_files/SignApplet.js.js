(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["nsd"] = factory();
    else
        root["nsd"] = factory();
})(this, function () {
    return /******/ (function (modules) { // webpackBootstrap
        /******/ 	// The module cache
        /******/ 	var installedModules = {};
        /******/
        /******/ 	// The require function
        /******/ 	function __webpack_require__(moduleId) {
            /******/
            /******/ 		// Check if module is in cache
            /******/ 		if (installedModules[moduleId])
                /******/ 			return installedModules[moduleId].exports;
            /******/
            /******/ 		// Create a new module (and put it into the cache)
            /******/ 		var module = installedModules[moduleId] = {
                /******/ 			exports: {},
                /******/ 			id: moduleId,
                /******/ 			loaded: false
                /******/
            };
            /******/
            /******/ 		// Execute the module function
            /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            /******/
            /******/ 		// Flag the module as loaded
            /******/ 		module.loaded = true;
            /******/
            /******/ 		// Return the exports of the module
            /******/ 		return module.exports;
            /******/
        }
        /******/
        /******/
        /******/ 	// expose the modules object (__webpack_modules__)
        /******/ 	__webpack_require__.m = modules;
        /******/
        /******/ 	// expose the module cache
        /******/ 	__webpack_require__.c = installedModules;
        /******/
        /******/ 	// __webpack_public_path__
        /******/ 	__webpack_require__.p = "";
        /******/
        /******/ 	// Load entry module and return exports
        /******/ 	return __webpack_require__(0);
        /******/
    })
    /************************************************************************/
    /******/([
    /* 0 */
    /***/ function (module, exports, __webpack_require__) {

        "use strict";
        function __export(m) {
            for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
        }
        __export(__webpack_require__(1));


        /***/
    },
    /* 1 */
    /***/ function (module, exports, __webpack_require__) {

        "use strict";
        var Deferred_1 = __webpack_require__(2);
        var helpers_1 = __webpack_require__(3);
        var CryptoClient = (function () {
            function CryptoClient(options) {
                /**
                 * Текущая открытая сессия
                 * @readonly
                 */
                this.session = null;
                var _a = this.settings = helpers_1.getOptions(options, CryptoClient.settings), noSsl = _a.noSsl, port = _a.port;
                this.baseUrl = (noSsl ? 'http' : 'https') + '://127.0.0.1:' + port + '/api/csp';
            }
            /**
             * Возвращает список установленных справочников сертификатов: 'GOST' и/или 'RSA'
             */
            CryptoClient.prototype.getTypes = function () {
                var promise = helpers_1.send(this.baseUrl + '/types', null);
                return this.settings.transformPromise(promise);
            };
            /**
             * Открывает сессию. Пытается открыть существующую сессию, если указан {@type ICryptoSessionId индентификатор}.
             * Затем пытается открыть новую сессию, если указаны {@type ICryptoSessionParams параметры}.
             * @param args идентификатор и/или параметры сессии
             * @returns открытая сессия
             */
            CryptoClient.prototype.open = function (args) {
                var _this = this;
                this.session = null;
                var promise = this.sessionPromise = helpers_1.send(this.baseUrl + '/open', args, function (res) {
                    return _this.session = {
                        id: res.id,
                        type: res.type,
                        profile: res.profile
                    };
                });
                promise.then(null, function () {
                    _this.sessionPromise = null;
                });
                return this.settings.transformPromise(promise);
            };
            /**
             * Закрывает сессию
             * @returns закрытая сессия
             */
            CryptoClient.prototype.close = function () {
                var _this = this;
                return this.send('/close', null, function (res) {
                    _this.sessionPromise = null;
                    _this.session = null;
                    return {
                        id: res.id,
                        type: res.type,
                        profile: res.profile
                    };
                });
            };
            CryptoClient.prototype.pack = function (files, options) {
                var _this = this;
                var arr = new Array(files.length);
                var deferred = new Deferred_1.Deferred();
                var sendRequest = function () {
                    _this.send('/pack', {
                        files: arr,
                        options: options
                    }).then(function (x) { return deferred.resolve(x); }, function (x) { return deferred.reject(x); });
                };
                var resolveFile = (function (cur, len) {
                    return function () {
                        if (++cur !== len)
                            return;
                        sendRequest();
                    };
                })(0, files.length);
                var rejectFile = function (err) {
                    rejectFile = function () { };
                    deferred.reject(err);
                };
                files.forEach(function (file, index) {
                    helpers_1.toCrutchBlob(file).then(function (b) {
                        arr[index] = {
                            name: file.name,
                            content: b.content,
                            encoding: b.encoding
                        };
                        resolveFile();
                    }, rejectFile);
                });
                return this.settings.transformPromise(deferred);
            };
            CryptoClient.prototype.unpack = function (buffer) {
                var _this = this;
                var deferred = new Deferred_1.Deferred();
                helpers_1.toCrutchBlob(buffer).then(function (b) {
                    return _this.send('/unpack', {
                        data: b
                    }).then(function (x) { return deferred.resolve(x); }, function (x) { return deferred.reject(x); });
                }, function (x) { return deferred.reject(x); });
                return this.settings.transformPromise(deferred);
            };
            CryptoClient.prototype.getCerts = function () {
                return this.send('/certs', null);
            };
            CryptoClient.prototype.sign = function (data, options) {
                var _this = this;
                var deferred = new Deferred_1.Deferred();
                helpers_1.toCrutchBlob(data).then(function (b) {
                    return _this.send('/sign', {
                        data: b,
                        options: helpers_1.getOptions(options, {
                            pkcs7: false,
                            detached: false,
                            sendCertificate: false,
                            sendChain: false
                        })
                    }).then(function (x) { return deferred.resolve(x); }, function (x) { return deferred.reject(x); });
                }, function (x) { return deferred.reject(x); });
                return this.settings.transformPromise(deferred);
            };
            CryptoClient.prototype.getHeadCert = function () {
                return this.send('/head', null);
            };
            CryptoClient.prototype.send = function (path, data, success) {
                var _this = this;
                return this.whenSession(function () {
                    if (data === null) {
                        data = _this.session.id;
                    }
                    else {
                        data.id = _this.session.id;
                    }
                    return helpers_1.send(_this.baseUrl + path, data, success);
                });
            };
            CryptoClient.prototype.whenSession = function (func) {
                var deferred = new Deferred_1.Deferred();
                if (this.sessionPromise) {
                    this.sessionPromise.then(function () {
                        func().then(function (x) { return deferred.resolve(x); }, function (x) { return deferred.reject(x); }, function (x) { return deferred.notify(x); });
                    }, noSession);
                }
                else {
                    noSession();
                }
                function noSession() {
                    deferred.reject({
                        code: 'E_NO_SESSION',
                        message: 'There is no active session'
                    });
                }
                return this.settings.transformPromise(deferred);
            };
            CryptoClient.settings = {
                port: 48737,
                useFileApi: false,
                transformPromise: function (promise) { return promise; },
                noSsl: false
            };
            return CryptoClient;
        }());
        exports.CryptoClient = CryptoClient;


        /***/
    },
    /* 2 */
    /***/ function (module, exports) {

        "use strict";
        var Deferred = (function () {
            function Deferred() {
                this.handlers = [];
                this.resolution = -1;
            }
            Deferred.prototype.then = function (done, fail, progress) {
                this.handlers.push([done, fail, progress]);
                if (this.resolution < 0)
                    return;
                this.handle(this.resolution);
            };
            Deferred.prototype.resolve = function (result) {
                this.result = result;
                this.handle(this.resolution = 0);
            };
            Deferred.prototype.reject = function (error) {
                this.result = error;
                this.handle(this.resolution = 1);
            };
            Deferred.prototype.notify = function (progress) {
                for (var i = 0; i < this.handlers.length; ++i) {
                    var handler = this.handlers[i][2];
                    if (handler)
                        handler.call(null, progress);
                }
            };
            Deferred.prototype.handle = function (funcIndex) {
                while (this.handlers.length) {
                    var handler = this.handlers.shift()[funcIndex];
                    if (handler)
                        handler.call(null, this.result);
                }
            };
            return Deferred;
        }());
        exports.Deferred = Deferred;


        /***/
    },
    /* 3 */
    /***/ function (module, exports, __webpack_require__) {

        "use strict";
        var Deferred_1 = __webpack_require__(2);
        /**
         * Конвертирует {@type Blob} в строку {@type ICrutchBlob}, строку оставляет как есть
         * @param data
         */
        function toCrutchBlob(data) {
            if (window['Blob'] && data instanceof Blob) {
                return blobToCrutchBlob(data);
            }
            var deferred = new Deferred_1.Deferred();
            deferred.resolve(data);
            return deferred;
        }
        exports.toCrutchBlob = toCrutchBlob;
        function blobToCrutchBlob(blob) {
            var deferred = new Deferred_1.Deferred();
            var reader = new FileReader();
            reader.onload = function () {
                var str = (this.result || '').replace(/^data:(.{0,99},)?/, '');
                deferred.resolve({
                    content: str,
                    encoding: 'base64'
                });
            };
            reader.onerror = function () {
                deferred.reject({
                    code: 'E_INVALID_DATA',
                    message: 'Cannot convert Blob to base64',
                    args: {
                        originalError: this.error
                    }
                });
            };
            reader.readAsDataURL(blob);
            return deferred;
        }
        function send(url, data, success) {
            var deferred = new Deferred_1.Deferred();
            try {
                var xhr_1 = new XHR();
                xhr_1.onload = function () {
                    var response = JSON.parse(xhr_1.responseText);
                    var xhrStatus = response.status;
                    var res = response.content;
                    if (xhrStatus > 0 && xhrStatus < 400) {
                        deferred.resolve(success ? success(res) : res);
                    }
                    else {
                        deferred.reject(res);
                    }
                };
                xhr_1.onerror = function () {
                    deferred.reject({
                        code: 'E_CONNECTION_ERROR',
                        message: 'Cannot connect to server'
                    });
                };
                xhr_1.open('POST', url);
                xhr_1.send(JSON.stringify(data));
            }
            catch (e) {
                deferred.reject({
                    code: 'E_CONNECTION_ERROR',
                    message: e.message
                });
            }
            return deferred;
        }
        exports.send = send;
        function getOptions(vals, defs) {
            var opts = {};
            vals = vals || {};
            Object.keys(defs).forEach(function (key) {
                var val = vals[key];
                opts[key] = val === undefined ? defs[key] : val;
            });
            return opts;
        }
        exports.getOptions = getOptions;
        var XHR = /MSIE [89]/i.test(navigator.userAgent) ? XDomainRequest : XMLHttpRequest;


        /***/
    }
    /******/])
});
var CspHttp = (function () {
    function CspHttp(encryptionType) {
        this.cc = new nsd.CryptoClient({
            transformPromise: function (promise) {
                var d = $.Deferred();
                promise.then(d.resolve, d.reject, d.notify);
                return d.promise();
            }
        });
        this.encryptionType = encryptionType;
    }

    CspHttp.prototype.initialize = function () {
        var self = this;
        var key = SignApplet.cspKey;
        var args = null;
        try {
            var argsStr = localStorage.getItem(key);
            args = JSON.parse(argsStr);
        } catch (e) {
            // do nothing
        }
        if (!args || (this.encryptionType && args.type !== this.encryptionType)) {
            args = {
                type: this.encryptionType
            };
        }
        return self.cc.getTypes().then(function (types) {
            if (!args.type) {
                args.type = types[0] || 'GOST';
            }
            return self.cc.open(args).then(function (session) {
                try {
                    localStorage.setItem(key, JSON.stringify({
                        id: session.id,
                        type: session.type
                    }));
                } catch (e) {
                    // do nothing
                }
                return self;
            });
        });
    };

    CspHttp.prototype.sign = function (content, options) {
        var opts = getOptions(options);
        return this.cc.sign({
            content: content,
            encoding: opts.isBase64 ? 'base64' : 'utf-8'
        }, opts).then(function (r) {
            return r.content;
        });
    };

    CspHttp.prototype.signFile = function (file, options) {
        var opts = getOptions(options);
        return this.cc.sign(file, opts).then(function (r) {
            return r.content;
        });
    };

    CspHttp.prototype.enumerateCertificates = function() {
        return $.Deferred().reject({
            code: 'NOT_IMPLEMENTED',
            message: 'enumerateCertificates is not implemented'
        });
    };

    CspHttp.prototype.makeCry = function () {
        return $.Deferred().reject({
            code: 'NOT_IMPLEMENTED',
            message: 'makeCry is not implemented'
        });
    };

    // задекорировать методы, чтобы они возвращали строки вместо объектов ошибок
    $.each(CspHttp.prototype, function (methodName, method) {
        CspHttp.prototype[methodName] = function () {
            return method.apply(this, arguments).then(null, function (e) {
                return '[' + e.code + '] ' + e.message;
            });
        };
    });

    function getOptions(options) {
        return $.extend({
            pkcs7: false,
            detached: false,
            sendCertificate: true,
            sendChain: false,
            isBase64: false
        }, options);
    }

    return CspHttp;
})();


// true, если на странице есть встроенный криптографический функционал
SignApplet.isNative = !!(window.__signatureApplet__ || window.$_DesktopInterop);

SignApplet.cspKey = 'csp-http-session';

SignApplet.reset = function () {
    try {
        localStorage.removeItem(this.cspKey);
    } catch (e) {
        // do nothing
    } 
};

function SignApplet(encryptionType) {
    if (SignApplet.isNative) {
        try {
            var $applet = window.__signatureApplet__
                || window.$_DesktopInterop.createApplet(); // NOTE: для совместимости со старым DesktopShell
        }
        catch (e) {
            SignApplet.isNative = false;
        }
    }

    // использовать крипто-сервис, если нет встроенного криптографического функционала
    if (!SignApplet.isNative) {
        var self = this;
        var ch = new CspHttp(encryptionType);
        $.each(ch, function (methodName, method) {
            self[methodName] = function () {
                return method.apply(ch, arguments);
            };
        });
        return;
    }

    this.initialize = function () {
        try {
            var errorCode = $applet.initialize();
            if (errorCode === 'E_OK') {
                return $.Deferred().resolve().promise();
            }
            return $.Deferred().reject(errorCode);
        } catch (e) {
            return $.Deferred().reject(e.message).promise();
        }
    };

    function safeCallApplet(resultJson) {
        var r;
        try {
            r = JSON.parse(resultJson);
        } catch (ex) {
            // Ошибка парсера JSON
            return { ok: false, errorMessage: 'JSON parser failure' };
        }
        return r;
    }

    function callApplet(resultJson) {
        var r;
        try {
            r = JSON.parse(resultJson);
        } catch (ex) {
            // Ошибка парсера JSON
            throw ex;
        }
        if (r.ok === true) {
            return r;
        }
        throw r;
    }

    this.makeCry = function (filename, content, certId, attachmentName, attachmentContent) {
        var deferral = $.Deferred();
        function handle(e) {
            if (e.ok === false) {
                deferral.reject(e.errorMessage);
            } else {
                deferral.reject(e.message);
            }
        }

        // Асинхронность, чтобы UI не залипал
        try {
            // Инициализация
            callApplet($applet.initMakeCryStreamed(filename, content, certId, attachmentName));

            function makeCry() {
                try {
                    setTimeout(function () {
                        try {
                            // Формирование CRYя
                            callApplet($applet.makeCryStreamed());

                            // Срыгивание CRYя
                            var cry = '';

                            function getCry() {
                                try {
                                    var result = callApplet($applet.getStreamedCryChunk());
                                    if (result.chunk === null) {
                                        deferral.resolve(cry);
                                        return;
                                    }

                                    cry += result.chunk;
                                    setTimeout(getCry, 0);
                                } catch (e) {
                                    handle(e);
                                }
                            }

                            getCry();

                        } catch (e) {
                            handle(e);
                        }
                    }, 0);
                } catch (e) {
                    handle(e);
                }
            }

            // Передача вложения
            if (attachmentContent !== null) {
                var chunkSize = parseInt($applet.getChunkSize());
                var offset = 0;

                function putAttachment() {
                    try {
                        if (offset < attachmentContent.length) {
                            var size = Math.min(attachmentContent.length - offset, chunkSize);
                            var chunk = attachmentContent.substr(offset, size);
                            offset += size;

                            callApplet($applet.putAttachmentChunk(chunk));
                            setTimeout(putAttachment, 0);
                        } else {
                            makeCry();
                        }
                    } catch (e) {
                        handle(e);
                    }
                }

                putAttachment();
            } else {
                makeCry();
            }
        } catch (e) {
            handle(e);
        }
        return deferral;
    };

    this.unpackCry = function (base64Cry) {
        var deferral = $.Deferred();

        var recipients = [];
        var head = { issuer: '', serialNumber: '' };
        function handle(e) {
            if (e.ok === false) {
                deferral.reject({ errorMessage: e.errorMessage, recipients: recipients, head: head });
            } else {
                deferral.reject({
                    errorMessage: e.errorMessage,
                    recipients: recipients,
                    head: head
                });
            }
        }

        try {
            callApplet($applet.uncryBegin());

            var chunkSize = parseInt($applet.getChunkSize());

            var offset = 0;
            while (offset < base64Cry.length) {
                var size = Math.min(base64Cry.length - offset, chunkSize);
                var chunk = base64Cry.substr(offset, size);
                offset += size;

                callApplet($applet.uncryPutChunk(chunk));
            }

            setTimeout(function () {
                try {
                    try {
                        callApplet($applet.uncryEnd());
                    } catch (ex) {

                        var r = safeCallApplet($applet.uncryGetRecipients());
                        if (r.ok) {
                            recipients = r.recipients;
                        } else {
                            recipients = [{
                                issuer: 'ERROR',
                                serialNumber: r.errorMessage
                            }];
                        }

                        r = safeCallApplet($applet.getHeadCertificate());
                        if (r.ok) {
                            head.issuer = r.issuer;
                            head.serialNumber = r.serialNumber;
                        } else {
                            head.issuer = 'ERROR';
                            head.serialNumber = r.errorMessage;
                        }

                        throw ex;
                    }

                    var files = [];

                    function fetchNextFile() {
                        try {
                            var r = callApplet($applet.uncryNextFile());
                            if (r.name === null) {
                                deferral.resolve({ files: files, recipients: recipients });
                                return;
                            }

                            var file = { name: r.name, content: '' };
                            files.push(file);

                            while (true) {
                                var c = callApplet($applet.uncryGetChunk());
                                if (c.chunk === null) {
                                    break;
                                }
                                file.content += c.chunk;
                            }

                            setTimeout(fetchNextFile, 0);
                        } catch (e) {
                            handle(e);
                        }
                    }

                    setTimeout(fetchNextFile, 0);
                } catch (e) {
                    handle(e);
                }
            }, 0);
        } catch (e) {
            handle(e);
        }
        return deferral;
    };

    this.sign = function (text, args) {
        args = $.extend({
            pkcs7: false,
            detached: false,
            sendCertificate: true,
            sendChain: false,
            isBase64: false
        }, args);

        try {
            var signedText = $applet.sign2(text, JSON.stringify(args));

            return $.Deferred().resolve(signedText).promise();
        } catch (e) {
            return $.Deferred().reject(e.message).promise();
        }
    };

    this.enumerateCertificates = function () {
        try {
            var certificatesString = $applet.enumerateCertificates();
            var certificatesArray = $.parseJSON(certificatesString);

            return $.Deferred().resolve(certificatesArray).promise();
        } catch (e) {
            return $.Deferred().reject(e.message).promise();
        }
    };

    this.signFile = function (file, args) {
        args = $.extend({
            pkcs7: false,
            detached: false,
            sendCertificate: true,
            sendChain: false,
            isBase64: false
        }, args);

        var signerUrl = "/E3D630B2-3360-4BF1-B44D-CE70963D5F02?args=" + encodeURIComponent(JSON.stringify(args));

        var formData = new FormData();
        formData.append('file', file);

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';

        var deferred = $.Deferred();
        xhr.onerror = function() {
            deferred.reject('signFile error');
        };
        xhr.onload = function() {
            if (this.status === 200) {
                deferred.resolve(this.response);
            } else {
                deferred.reject('signFile error ' + this.status + ' ' + this.statusText);
            }
        };

        xhr.open('POST', signerUrl, true);
        xhr.send(formData);

        return deferred.promise();
    }
}
