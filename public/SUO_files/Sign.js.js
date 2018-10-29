var uploadedFile;

function fillFileNSD(elem) {
    uploadedFile = elem.files[0];
}

function signTextNSD() {
    PF('sendToNsd').hide();
    startLoadStatus();
    // #255575 Предлагать выбор сертификата при каждой подписи
    clearCertificate();
    signNSD64($('input[id*="textToSign"][type="hidden"]').val()).done(function (signature) {
        $('input[id*="signature"][type="hidden"]').val(signature);
        startLoadStatus();
        signTextCommand();
    }).fail(function (error) {
        PF('growlWV').renderMessage({
            "summary": "Ошибка криптосервера.",
            "detail": errorsParser(error),
            "severity": "error"
        });
        stopLoadStatus();
    });
}

function signFileNSD() {
    startLoadStatus();
    // #255575 Предлагать выбор сертификата при каждой подписи
    clearCertificate();
    var file = uploadedFile;
    if (!file) {
        PF('growlWV').renderMessage({
            "summary": "Ошибка криптосервера.",
            "detail": "Отсутствует файл для подписи.",
            "severity": "error"
        });
        stopLoadStatus();
        return;
    }

    var applet = new SignApplet();

    // подписать файл file
    var promise = applet.initialize().then(function () {
        return applet.signFile(file, {
            detached: true,
            sendCertificate: false
        });
    });

    function _arrayBufferToBase64(buffer) {
        if (typeof buffer === 'string') {
            return buffer;
        }
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    promise.done(function (sign) {
        $('input[id*="signature"][type="hidden"]').val(_arrayBufferToBase64(sign));
        stopLoadStatus();
    }).fail(function (error) {
        stopLoadStatus();
        PF('growlWV').renderMessage({
            "summary": "Ошибка криптосервера.",
            "detail": errorsParser(error),
            "severity": "error"
        })
    });
}

function signLoginNSD() {
    startLoadStatus();
    // #255575 Предлагать выбор сертификата при каждой подписи
    clearCertificate();
    signNSD64($('input[id*="textToSign"][type="hidden"]').val()).done(function (signature) {
        $('input[id*="signature"][type="hidden"]').val(signature);
        startLoadStatus();
        signTextCommand();
    }).fail(function (error) {
        PF('growlWV').renderMessage({
            "summary": "Ошибка криптосервера.",
            "detail": errorsParser(error),
            "severity": "error"
        })
    });
}

function signNSD64(textToSignStr) {
    if (textToSignStr === undefined || textToSignStr === '') {
        PF('growlWV').renderMessage({
            "summary": "Ошибка криптосервера.",
            "detail": "Отсутствует сообщение для подписи.",
            "severity": "error"
        });
        stopLoadStatus();
        return;
    }

    var applet = new SignApplet();

    // инициализируем
    var initializePromise = applet.initialize();

    // делим строку textToSignStr на кусочки и подписываем их в несколько "потоков"
    var signPromiseArr = textToSignStr.split(';').map(function (textToSign) {
        return initializePromise.then(function () {
            return applet.sign(textToSign, {
                detached: true, // без исходной строки
                sendCertificate: false, // без сертификата
                isBase64: true
            });
        });
    });

    // объединяем результат при успешном завершении всех "потоков"
    return $.when.apply($, signPromiseArr).then(function () {
        return Array.prototype.join.call(arguments, ';');
    });
}

function clearCertificate() {
    SignApplet.reset();
}

function errorsParser(error) {
    var detail = "";
    if (error.indexOf('E_CONNECTION_ERROR') >= 0) {
        detail = "<a href='https://127.0.0.1:48737/' target='_blank' style='color: red;'>Проверить соединение</a>";
    } else if (error.indexOf('E_INVALID_CONTRACT') >= 0) {
        detail = 'Невалидный контракт запроса.<br/>(' + error + ')';
    } else if (error.indexOf('E_INTERNAL_SERVER_ERROR') >= 0) {
        detail = 'Внутренняя ошибка сервера.<br/>(' + error + ')';
    } else if (error.indexOf('E_FORBIDDEN') >= 0) {
        detail = 'Доступ закрыт.<br/>(' + error + ')';
    } else if (error.indexOf('E_API_METHOD_NOT_FOUND') >= 0) {
        detail = 'Метод API не найден.<br/>(' + error + ')';
    } else if (error.indexOf('E_MAX_REQUEST_LENGTH') >= 0) {
        detail = 'Превышен максимальный размер тела запроса.<br/>(' + error + ')';
    } else if (error.indexOf('E_INVALID_CONTENT_TYPE') >= 0) {
        detail = 'Невалидный формат тела запроса.<br/>(' + error + ')';
    } else if (error.indexOf('E_SESSION_NOT_FOUND') >= 0) {
        detail = 'Сессия не найдена.<br/>(' + error + ')';
    } else if (error.indexOf('E_PKI_NOT_FOUND') >= 0) {
        detail = 'Не найден локальный справочник сертификатов Валидата.<br/>(' + error + ')';
    } else if (error.indexOf('E_PKI_OPERATION') >= 0) {
        detail = 'Исключение при работе с VCERT на уровне логики.<br/>(' + error + ')';
    } else if (error.indexOf('E_FAKE_ERROR') >= 0) {
        detail = 'Тестовая ошибка.<br/>(' + error + ')';
    } else {
        detail = 'Ошибка валидаты.<br/>(' + error + ')';
    }
    return detail;
}