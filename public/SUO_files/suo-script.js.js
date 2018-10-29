
function fireWhenCalendarIsEmpty(input, func) {
    var $input = $(input);
    var result = $input.val().replace(/_|\./g, '');
    if (result.length === 0) {
        $input.val('');
    }
    if (func != undefined) {
        func();
    }
}

function fixEmptyMessageColspan() {
    if ($("tr.ui-datatable-empty-message td")) {
        var hiddenColumns = $("div.deals div.ui-datatable-tablewrapper table thead tr th.ui-helper-hidden").size();
        if (hiddenColumns > 0) {
            var allColumns = $("div.deals div.ui-datatable-tablewrapper table thead tr th").size();
            $("tr.ui-datatable-empty-message td").attr("colspan", allColumns - hiddenColumns);
        }
    }
}

function fixEmptyMessageColspanLiquidity() {
    $("tr.ui-datatable-empty-message td").attr("colspan", 4);
}

function resetPagination(widgetId) {
    PF(widgetId).getPaginator().setPage(0);
}

// Дизейблим/енэйблим скоролл
function disableScrollBar(disableOn) {
    //clearFieldName();
    if (disableOn) {
        $('body').addClass('noscroll');
    } else {
        $('body').removeClass('noscroll');
    }
}

/*Очищаем параметр фильтра*/
/*function clearFieldName() {
    HideFieldNameForTable();
}*/


/**
 * Собственная реализация функции обновления DataTable для случая обновления данных через p:poll или websocket.
 *
 * Зачем эта функция:
 * Есть таблица с исходными данными. Данные таблицы обновляются каждые N секунд.
 * Отфильтровав таблицу по значению некоторого поля, получаем таблицу с новым заполнением.
 *
 * Возникающая проблема:
 * Отфильтрованная таблица не обновляется автоматически, пока установлен фильтр.
 *
 * Решение:
 * После обновления данных фильтровать таблицу, после чего PF обновит страницу, вызвав paginate.
 * Эта функция переопределяет стандартную функцию фильтрации PF, т.к. стандартная функция
 * устанавливает первую страницу для просмотра, отображает лоадер.
 * На стороне сервера в PageEvent необходимо проверять входит ли выбранная строка в список на текущей странице и
 * снимать выделение со строки, если она не попадает в диапазон или не входит в состав отфильтрованных данных.
 * Если кол-во страниц после фильтрации уменьшилось, устанавливает последнюю страницу для просмотра.
 *
 * @param widget - обновляемый DataTable
 */
function filterBlotter(widget) {
    if (PrimeFaces.widgets.top_cdDeleteDraft && PrimeFaces.widgets.top_cdDeleteDraft.isVisible()) {
	    // не скрывает диалоговое окно, не сохраняет номер страницы
	    filterDataTableWithoutAjaxStatus(widget);
    } else {
	    // скрывает диалоговое окно, зато сохраняет номер страницы
	    filterDataTableWithoutAjaxStatus(
		    widget,
		    filterBlotterSuccessHandler,
		    filterBlotterComplete,
		    filterBlotterAjaxRequest
	    );
    }
}

function filterBlotterSuccessHandler(data) {
    if (data.indexOf("ui-datatable-empty-message") !== -1) {
        filterSuccessHandler.call(this, data);
    }
}

function filterBlotterComplete(xhr, status, data) {
    var paginator = this.getPaginator();
    if (paginator) {
        if (data.totalRecords > 0) {
            paginator.cfg.rowCount = data.totalRecords;
            paginator.cfg.pageCount = Math.ceil(data.totalRecords / paginator.cfg.rows) || 1;
            if (paginator.cfg.page > paginator.cfg.pageCount - 1) {
                paginator.cfg.page = paginator.cfg.pageCount - 1;
            }
            var cfg = {
                first: paginator.cfg.rows * paginator.cfg.page,
                rows: paginator.cfg.rows,
                page: paginator.cfg.page
            };
            // paginator.cfg.paginate.call(paginator, cfg);
            paginateBlotter(this, cfg);
        } else {
            paginator.setTotalRecords(0);
        }
    }
}

function filterBlotterAjaxRequest(widget, opts) {
    PrimeFaces.ab({
        s: widget.id,
        e: "filter",
        p: widget.id,
        g: false,
        onco: function(xhr, status, args){
            fixEmptyMessageColspan();
        }
    }, opts);
}

/**
 * Собственная реализация функции paginate для DataTable paginator.
 * Загружает страницу без лоадера.
 *
 * @param widget - обновляемый DataTable
 * @param cfg - params для PrimeFaces.ab()
 */
function paginateBlotter(widget, cfg) {
    var opts = {
        source: widget.id,
        update: widget.id,
        process: widget.id,
        formId: widget.cfg.formId,
        params: [
            {name: widget.id + "_pagination", value: true},
            {name: widget.id + "_first", value: cfg.first},
            {name: widget.id + "_rows", value: cfg.rows},
            {name: widget.id + "_encodeFeature", value: true}
        ], onsuccess: function (doc, status, xhr) {
		    // вызов PrimeFaces.ajax.Response.handle скрывает открытые диалоговые окна
            PrimeFaces.ajax.Response.handle(doc, status, xhr, {
                widget: widget, handle: function (data) {
                    this.updateData(data);
                    if (this.checkAllToggler) {
                        this.updateHeaderCheckbox();
                    }
                    if (this.cfg.scrollable) {
                        this.alignScrollBody();
                    }
                }
            });
            return true
        }, oncomplete: function () {
            widget.paginator.cfg.page = cfg.page;
            widget.paginator.updateUI();
        }
    };
    if (widget.hasBehavior("page")) {
        var page = widget.cfg.behaviors.page;
        PrimeFaces.ab({
            s: widget.id,
            e: "page",
            p: widget.id,
            u: "form:top_dealsActionButtons",
            g: false
        }, opts);
    } else {
        PrimeFaces.ajax.Request.handle(opts);
    }
}

/**
 * Фильтрация таблицы без отображения AjaxStatus
 * @param widget - DataTable
 * @param successHandlerCallback
 * @param completeCallback
 * @param ajaxRequestCallback
 */
function filterDataTableWithoutAjaxStatus(widget, successHandlerCallback, completeCallback, ajaxRequestCallback) {

    successHandlerCallback = successHandlerCallback || filterSuccessHandler;
    completeCallback = completeCallback || filterComplete;
    ajaxRequestCallback = ajaxRequestCallback || filterAjaxRequest;

	var opts = {
		source: widget.id,
		update: widget.id,
		process: widget.id,
		formId: widget.cfg.formId,
        global: false,
		params: [
		    {name: widget.id + "_filtering", value: true},
            {name: widget.id + "_encodeFeature", value: true}
        ], onsuccess: function (doc, status, xhr) {
			PrimeFaces.ajax.Response.handle(doc, status, xhr, {
				widget: widget, handle: successHandlerCallback
			});
			return true;
		}, oncomplete: completeCallback.bind(widget)
	};

	if (widget.hasBehavior("filter")) {
        ajaxRequestCallback(widget, opts);
	} else {
		PrimeFaces.ajax.AjaxRequest(opts);
	}
}

function filterSuccessHandler(data) {
    this.updateData(data);
    if (this.cfg.scrollable) {
        this.alignScrollBody();
    }
    if (this.isCheckboxSelectionEnabled()) {
        this.updateHeaderCheckbox();
    }
}

function filterComplete(xhr, status, data) {
    var paginator = this.getPaginator();
    if (paginator) {
        paginator.setTotalRecords(data.totalRecords);
    }
}

function filterAjaxRequest(widget, opts) {
    PrimeFaces.ab({
        s: widget.id,
        e: "filter",
        p: widget.id,
        g: false
    }, opts);
}

function doSaveRowsPerPage(widget, table, callback) {
    PF(widget).paginator.rppSelect.change(function () {
        persistRows([{name: 'rows', value: this.value}, {name: 'table', value: table}]);
        PF(widget).paginator.setPage(0);
        if (callback != undefined) {
            callback();
        }
    });
}

function signSavedOrderString(str, successCallback, showErr) {
    successCallback('savedOrder');
}

function signString(str, successCallback, showErr) {
    var cc = new nsd.CryptoClient();

    var ccClose = function(cc) {
        cc.close().then(function(result) {
        }, function(error) {
            console.log('error while close cc', error);
        });
    };

    // открытие сессии
    function signWithOpenSession() {
        // получение "головы"
        cc.getHeadCert().then(function(cert) {
            console.log('success', cert);

            var data = {content: str, encoding: 'base64'};

            var options = {
                pkcs7: false,
                detached: true,
                sendCertificate: true,
                sendChain: true
            };

            // подписывание данных
            cc.sign(data, options).then(function(result) {
                if(successCallback)
                    successCallback(result.content);
                console.log('signed string ' + str + ' : ' + result.content);

            }, function(error) {
                console.log('error sign data', error);
                showErr(error);
            });

        }, function(error) {
            console.log('error get head cert', error);
            showErr(error);
        });
    }

    cc.open({type: 'GOST'}).then(function(result) {
        signWithOpenSession();
    }, function(err) {
        cc.open({type: 'RSA'}).then(function(result) {
            signWithOpenSession();
        }, function(error) {
            console.log('error open RSA session', error);
            showErr(error);
        });
    });
}

function clearTableFilter(table, filterValue) {
    table.thead.find('> tr > th.ui-filter-column > .ui-column-filter').val('');
    $(table.jqId + '\\:globalFilter').val(filterValue || '');
}

function augmentListWndDialog(dialogWidget, tableWidgetVar, renderCommand, clearCommand) {
    dialogWidget.openAsync = function (value, filterValue) {
        var table = PF(tableWidgetVar);
        if (table) {
            if (value) {
                // если загружена таблица и есть значение в поле ввода,
                // то очистить фильтры таблицы и задать globalFilter для установленного значения
                clearTableFilter(table, filterValue);
                table.filter();
            } else {
                // если загружена таблица и поле ввода пустое,
                // то очистить выделение и все фильтры таблицы
                table.unselectAllRows();
                clearCommand.call(clearCommand);
            }
        } else if (value) {
            // если поле ввода презаполнено при открытии страницы,
            // то установить globalFilter после загрузки таблицы
            renderCommand.call(renderCommand);
        } else {
            // если поле ввода пустое или очищено при открытии страницы,
            // то очистить все фильтры таблицы после загрузки
            clearCommand.call(clearCommand);
        }
    };

    dialogWidget.clearTableFilter = function () {
        var handle = setInterval(function () {
            var table = PF(tableWidgetVar);
            if (table) {
                clearTableFilter(table);
                table.filter();
                doSaveRowsPerPage(tableWidgetVar, tableWidgetVar);
                clearInterval(handle);
            }
        }, 50);
    };

    dialogWidget.refreshAsync = function(filterValue) {
        var handle = setInterval(function () {
            var table = PF(tableWidgetVar);
            if (table) {
                clearTableFilter(table, filterValue);
                table.filter();
                doSaveRowsPerPage(tableWidgetVar, tableWidgetVar);
                clearInterval(handle);
            }
        }, 50);
    }
}

function disableOnClickRowReorder() {
    $('.editable-table input').on("keydown", function() {
        $(this).parents('tbody').sortable({cancel: 'tr'});
    });
}

function rowExpansion(dataTable) {
    var $this = dataTable;
    $this.tbody.children('tr').css('cursor', 'pointer');
    $this.tbody.off('click.datatable-expansion', '> tr')
        .on('click.datatable-expansion', '> tr.expandable', null, function () {
	        if ($(this).hasClass("block-expansion")) {
		        $this.collapseAllRows();
	        } else if ($(this).hasClass("ui-expanded-row")) {
                $this.toggleExpansion($(this).find('div.ui-row-toggler'));
            } else {
                $this.collapseAllRows();
                $this.toggleExpansion($(this).find('div.ui-row-toggler'));
            }
        });
}

function showErrMsg(mess) {
    // TODO нужно определиться, где показывать ошибку и блокировать ли экран на время подписания
    if (mess && mess.message) {
        alert(mess.message);
    } else {
        alert("Ошибка : " + mess);
    }
}

function processMarshalledRecallOrderResult(xhr, status, args) {
    var orderXml = args.orderXml;

    signString(orderXml,
        function (signedData) {
            recallOrder([{name: 'signed', value: signedData}, {name: 'orderXml', value : orderXml}]);
        },
        function (errm) {
            stopLoadStatus();
            showErrMsg(errm);
        })
}

/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */
function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}

function refreshPage() {
    location.reload();
}

function addRefreshPageOnClosePopupHandler() {
    $("#primefacesmessagedlg div a").bind("click", refreshPage);
}

function disableControls(idSuffix) {
    $("[id$='" + idSuffix + "']").addClass('disabled-control');
}

function enableControls(idSuffix) {
    $("[id$='" + idSuffix + "']").removeClass('disabled-control');
}

function onColumnsChanged(dataTableWidget) {
    setDataTableWidth(dataTableWidget);
    clearHiddenFilters(dataTableWidget);
}

function setDataTableWidth(dataTableWidget, widthDiff) {
    var tableWidth = document.body.clientWidth - (widthDiff || 60);
    PF(dataTableWidget).jq.css({"overflow-x": "auto", "width": tableWidth + "px"});
}

/*
    Данная переменная функции выполнит переданную ей функцию через определенный таймаут
    Причем, будет выполнена только та функция, которая передана при последнем вызове
 */
var filterDelay = (function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();

/**
    Данная фнукция используется для автоматической фильтрации DataTable, указанного в widget по нажатии клавиши.

    Проблема: при нажатии любой клавиши, когда курсор находится в input-поле быстрого фильтра, всегда отправляется
    запрос, не зависимо от того было ли изменено значение поле.

    Решение: фильтровать DataTable только в том случае, если значение поля после нажатия изменилось

    @param widget - значение атрибута widgetWar у DataTable
    @param event - событие нажатия клавиши
 */
function handleFilterKeyUp(widget, event) {
    var evt = event || window.event;
    if (__isValueKeyCode(evt.keyCode)) {
        filterDelay(function() {
            PF(widget).filter();
        }, 700);
    }
}

function handleCalendarFilterKeyUp(widgetId, input, event) {
    var evt = event || window.event;
    var k_backspace = 8;
    var k_enter = 13;
    if(__isNumberKeyCode(evt.keyCode) || evt.keyCode === k_backspace || evt.keyCode === k_enter) {
        var $input = $(input);
        var result = $input.val().replace(/_|\./g, '');
        if (result.length === 0) {
            $input.val('');
        }
        if (result.length === 8 || result.length === 0) {
            PF(widgetId).filter();
        }
    }
}

function __isNumberKeyCode(keyCode) {
    return keyCode >= 46 && keyCode <= 57 || // number keys
        keyCode >= 96 && keyCode <= 105;  //numpad keys
}

function clearFilters(dataTableWidget) {
    var dataTable = PF(dataTableWidget);
    var columns = dataTable.getThead()[0].childNodes[0].childNodes;

    var needFilter = false;
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        needFilter |= __clearFilter(column);
    }

    if (needFilter) {
        dataTable.filter();
    }
}

function clearHiddenFilters(dataTableWidget) {
    var dataTable = PF(dataTableWidget);
    var columns = dataTable.getThead()[0].childNodes[0].childNodes;

    var needFilter = false;
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        needFilter |= __clearFilter(column);
    }

    if (needFilter) {
        dataTable.filter();
    }
}

function __clearFilter(column) {
    var filter = __getFilter(column);

    if(filter == undefined) {
        return false;
    }

    if (isFilterInput(filter)) {
        var filterInput = filter.childNodes[0];
        if (filterInput.value != "") {
            filterInput.value = "";
            return true;
        }
    }

    if (isFilterCalendar(filter)) {
        var filterCalendar = filter.getElementsByClassName("calendarFilter")[0].childNodes[0];
        if(filterCalendar.value != "") {
            filterCalendar.value = "";
            return true;
        }
    }

    if (isFilterOneMenu(filter)) {
        var oneMenuFilter = filter.childNodes[0].childNodes[1].childNodes[0];
        if (oneMenuFilter.value != '') {
            oneMenuFilter.value = '';
            filter.childNodes[0].getElementsByClassName("ui-selectonemenu-label")[0].innerHTML = '';
            return true;
        }
    }

    return false;
}

function __getFilter(column) {
    return column.getElementsByClassName("ui-column-customfilter")[0];
}

/**
 Функция используется для определения того изменилось ли значения поля при нажатии клавиши с кодом keyCode

 @param {number} keyCode - код клавиши

 @return {boolean} true - если нажатие клавиши меняет значение поля, false - в противном случае
 */
function __isValueKeyCode(keyCode) {
    var k_space = 32;
    var k_dash = 189;
    var k_backspace = 8;
    var k_enter = 13;
    var is_valid = (keyCode === k_backspace || keyCode === k_space || keyCode === k_dash || keyCode === k_enter ||
    __isNumberKeyCode(keyCode) ||
    (keyCode >= 65 && keyCode <= 90) || // letter keys
    (keyCode >= 96 && keyCode <= 111) || //// numpad keys
    (keyCode > 185 && keyCode < 193) || // ;=,-./`
    (keyCode > 218 && keyCode < 223));// [{}\|]
    return is_valid;
}

function focusOnElement(link, tab) {
    if(tab != '') {
        PF('tabMenu').select(tab);
    }
    // для полей типа LIST сначала раскрыть выпадающий список затем сфокусироваться в фильтр
    var $link = $('#' + link);
    if(link.indexOf('_label') !== -1) {
        $link.click();
        var link_filter = link.replace('_label','_filter');
        var $link_filter = $('#' + link_filter);
        $link_filter.focus().effect("highlight", {}, 3000);
    }else {
        // для всех остальных полей достаточно фокусировки
        $link.focus().effect("highlight", {}, 3000);
    }
}

function isFilterInput(filter) {
    return filter.childNodes[0].tagName == "INPUT";
}

function isFilterCalendar(filter) {
    return filter.getElementsByClassName("calendarFilter").length != 0;
}

function isFilterOneMenu(filter) {
    return filter.childNodes[0].classList.contains("ui-selectonemenu");
}

function bindOnPasteEventListenersToFilters(dataTableWidget) {
    var dataTable = PF(dataTableWidget);
    var columns = dataTable.getThead()[0].childNodes[0].childNodes;
    for(var i = 0; i < columns.length; i++) {
        var filter = __getFilter(columns[i]);
        if(filter != null) {
            if(isFilterInput(filter) || isFilterCalendar(filter)) {
                $(filter.getElementsByTagName('input')[0]).bind('paste', function() {
                    filterDelay(function() {
                        PF(dataTableWidget).filter();
                    }, 500);
                });
            }
        }
    }
}

function updateSelectionLabel(htmlSelectionId, defaultValue) {
    var label = "";
    var selectCheckBox = document.getElementById(htmlSelectionId);

    var hiddenContainer = selectCheckBox.getElementsByClassName('ui-helper-hidden')[0];
    var inputs = hiddenContainer.getElementsByTagName('input');

    var outputLabel = selectCheckBox.getElementsByClassName('ui-selectcheckboxmenu-label')[0];

    if(inputs.length == 0) {
        outputLabel.innerText = defaultValue;
        return;
    }
    var labels = hiddenContainer.getElementsByTagName('label');
    var active_increment = 0;

    buildLabel();

    if(active_increment == inputs.length || active_increment == 0) {
        outputLabel.innerText = defaultValue;
        return;
    }
    label = label.replace(', ', '');

    outputLabel.innerText = label;

    function buildLabel() {
        for(var elements_iterator = 0; elements_iterator < inputs.length; elements_iterator++) {
            if(inputs[elements_iterator].checked) {
                label += ", " + labels[elements_iterator].innerText;
                active_increment++
            }
        }
    }
}

function removeHighlight(tableId) {
    $("thead[id*='" + tableId + "_head'] th").removeClass("ui-state-highlight").removeClass("ui-state-focus");
}

function markMarkingTabsIfValidationFailed() {
   // console.log("markMarkingTabsIfValidationFailed");
    var markingTabIndexEl = document.getElementById("markingTabIndex");
    if(markingTabIndexEl != undefined) {
     //   console.log("markMarkingTabsIfValidationFailed activeTab " + markingTabIndexEl.value);
        $("a[href='#form:tabs:" + markingTabIndexEl.value + ":tabPanel']").removeClass("validation-error");
    }
    $(".ui-tabs .ui-messages-error").each(function() {
        var href = $(this).parents(".ui-tabs-panel").attr("id").replace(/:/g, "\\:");
       // console.log("markMarkingTabsIfValidationFailed process element href " + href);
        $("a[href='#" + href + "']").addClass("validation-error");
    });
}

function markTabsIfValidationFailed() {
    $(".ui-tabs .ui-messages-error").each(function() {
        var href = $(this).parents(".ui-tabs-panel").attr("id").replace(/:/g, "\\:");
        $("a[href='#" + href + "']").addClass("validation-error");
    });
}

function bindOnClickOutEditableTable(items, callback) {
    $(document).on('click', function(event) {

        var isClickIn = false;
        if (!callback || !items || !items.length) {
            return;
        }
        items.forEach(function (item) {
            if ($(event.target).closest(item).length) {
                isClickIn = true;
            }
        });
        if (!isClickIn) {
            callback();
        }
    });
}

function bindOnClickOutEditableTableMarking(items, callback) {
   // console.log("bindOnClickOutEditableTableMarking");
    $(document).on('click', function(event) {
      //  console.log("click Out EVENT! event.target: " + event.target.id);
        var isClickIn = false;
        if (!callback || !items || !items.length) {
            return;
        }
        items.forEach(function (item) {
            if ($(event.target).closest(item).length) {
                isClickIn = true;
            }
        });
        if (!isClickIn) {
            callback();
        }
    });
}

function callBackClickEditableTable(){

   // stopEditTable();

}


function bindOnClickMarkingTabs(callback) {
    $(document).ready(function() {
        $('.markup-tabs > .ui-tabs-nav > li').off('click');
        $(".markup-tabs > .ui-tabs-nav").on("click", "li", function() {
            callback([{
                name: 'tabIndex',
                value: $(this).index()
            }]);
        });
    });
}

function setComponentReadonly(elementId) {
    $(document).ready(function () {
        element = document.getElementById(elementId);
        if (element != null)
            element.readOnly = true;
    });
}

var stopTime;

function initListwnd() {

    var start = Date.now();
    $('.listwnd').trigger("input");
    $('.listwnd').prop('readonly', true);

    if(stopTime != undefined){
        stopLoadStatus();
     //   console.log("Page init time: "  + ( Date.now() - stopTime));
    }

}

// show delayed dialog

function startLoadStatusImmediatly() {
    if (statusDlgTimer === null) {
        startTime = Date.now();
        // console.log("startLoadStatus startTime: " + startTime);
        statusDlgTimer = setTimeout("PF('statusDialog').show()", 10);
    }
}

function startLoadStatus() {
    if (statusDlgTimer === null) {
        startTime = Date.now();
       // console.log("startLoadStatus startTime: " + startTime);
        statusDlgTimer = setTimeout("PF('statusDialog').show()", 500);
    }
}

// hide dialog / cancel timer
function stopLoadStatus() {
    if (statusDlgTimer !== null) {
        clearTimeout(statusDlgTimer);
        PF('statusDialog').hide();
        statusDlgTimer = null;

        stopTime = Date.now();
     //  console.log("stopLoadStatus time: " +  ( Date.now() - startTime));
    }
}


function processListWndById(elementId){
  //  console.log('processListWndById ' + elementId);
}

function processListWndChange(element){
  //  console.log('processListWndChange ' + element.id);
}


function initListwndEvent(){
     $(document).on('input', '.listwnd', function() {
     //   console.log("input event triggered");
        if (this.value) {
            $(this).addClass('x');
        } else {
            $(this).removeClass('x');
        }
    }).on('mousemove', '.x', function( e ){

        // console.log("mousemove " + this.id);
        if (!($(this).is(':disabled') || $(this).hasClass('disabled') || $(this).hasClass('ui-state-disabled'))) {
            if (this.offsetWidth-18 < e.clientX-this.getBoundingClientRect().left) {
                $(this).addClass('onX');
            } else {
                $(this).removeClass('onX');
            }
        }
    }).on('touchstart mousedown', '.onX', function( ev ){
        //   console.log("touchstart  mousedown" + this.id);
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (!($(this).is(':disabled') || $(this).hasClass('disabled') || $(this).hasClass('ui-state-disabled'))) {
            $(this).removeClass('x onX').val('').change();
        }
    });
}

jQuery(function($) {

    initListwndEvent();
   // initListwnd();
});

function changeFocusOnTab(){
    $('html, body').animate({
        scrollTop : $("#form\\:tab").offset().top
    }, 250);
}

function editBrowserUrlWhenTabChanged(e) {
    var selectedTabIdx = e.cfg.selected;
    var currentUrl = window.location.pathname + window.location.search;
    if(currentUrl.indexOf("activeTab") !== -1) {
        currentUrl = currentUrl.replace(/(activeTab=)\d/, '$1' + selectedTabIdx);
    } else {
        if (window.location.search === "") {
            currentUrl += "?activeTab=" + selectedTabIdx;
        } else {
            currentUrl += "&activeTab=" + selectedTabIdx;
        }
    }
    //push to browser
    history.replaceState({}, document.title, currentUrl);
}

/**
 * Костыльный вариант editBrowserUrlWhenTabChanged специально для маркрирования
 */
function appendTabIndexToUrl() {
    var activeTabIndex = $(".markup-tabs > .ui-tabs-nav > .ui-tabs-selected").index();
    var currentUrl = window.location.pathname + window.location.search;
    currentUrl = currentUrl.replace(/#.+/, '');
    if(currentUrl.indexOf("activeTab") !== -1) {
        currentUrl = currentUrl.replace(/(activeTab=)\d/, '$1' + activeTabIndex);
    } else {
        if(window.location.search === "") {
            currentUrl += "?activeTab=" + activeTabIndex;
        } else {
            currentUrl += "&activeTab=" + activeTabIndex;
        }
    }
    //push to browser
    history.replaceState({}, document.title, currentUrl);
}

function rejectInvalidDate(calendar) {
    if (!moment(calendar.value, 'DD.MM.YYYY').isValid()) {
        calendar.value = "";
    }
}

function resetScroll() {
    var scrollPanel = $(".order-info-fieldset");
    scrollPanel.scrollTop(0);
    scrollPanel.scrollLeft(0);
}

function removeSortableHelper() {
    var style = 'style:contains(*{ cursor: move !important; })';
    $(style).remove();
    $('body').removeAttr('style');
    $('.ui-datatable.ui-widget.ui-sortable-helper').remove();
}

function setLeavePageWarningOn() {
    if(!window.onbeforeunload) {
        window.onbeforeunload = function(e) {
            return '';
        };
    }
}

function setLeavePageWarningOff() {
    window.onbeforeunload = null;
}

function setLeavePageWarningIfFaild(xhr, status, args) {
    if(args.validationFailed) {
        setLeavePageWarningOn();
    }
}

function startExportLoadStatus() {
    if(window.onbeforeunload) {
        haveBeforeUnload = true;
        setLeavePageWarningOff();
    }
    startLoadStatus();
}

function stopExportLoadStatus() {
    stopLoadStatus();
    if(typeof haveBeforeUnload !== "undefined" && haveBeforeUnload) {
        setLeavePageWarningOn();
    }
}

function openNewWindow(url, params) {
    window.open(url, params || '_blank',
        'width=' + (document.documentElement.clientWidth || window.innerWidth || document.body.clientWidth) +
        ', height=' + (document.documentElement.clientHeight || window.innerHeight || document.body.clientHeight) + ', resizable=yes, scrollbars=yes');
    return false;
}

function hideUrlMail(){
    document.getElementById('sendMail').style.display = 'none';
    document.getElementById('mailSent').style.display = 'inline';
    addScreenshot();
}

function filterNumberOnly(input) {
    var $input = $(input);
    var result = $input.val().replace(/[^0-9]/g, '');
    $input.val(result)
}