//------------------------------------PrimeFaces--

PrimeFaces.locales ['ru'] = {
    closeText: 'Закрыть',
    prevText: 'Назад',
    nextText: 'Вперёд',
    currentText: 'Home',
    monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    dayNamesShort: ['Воск', 'Пон', 'Вт', 'Ср', 'Четв', 'Пят', 'Суб'],
    dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    weekHeader: 'Неделя',
    firstDay: 1,
    isRTL: false,
    showMonthAfterYear: false,
    yearSuffix: '',
    timeOnlyTitle: 'Только время',
    timeText: 'Время',
    hourText: 'Час',
    minuteText: 'Минута',
    secondText: 'Секунда',
    currentText: 'Сегодня',
    ampm: false,
    month: 'Месяц',
    week: 'неделя',
    day: 'День',
    allDayText: 'Весь день'
};

//timer
var statusDlgTimer = null;

// show delayed dialog
function startLoadStatus() {
    if (statusDlgTimer === null) {
        statusDlgTimer = setTimeout("PF('statusDialog').show()", 500);
    }
}

// hide dialog / cancel timer
function stopLoadStatus() {
    if (statusDlgTimer !== null) {
        clearTimeout(statusDlgTimer);
        PF('statusDialog').hide();
        statusDlgTimer = null;
    }
}

function selectRow(rowId, widgetId) {
    PF(widgetId).unselectAllRows();
    PF(widgetId).selectRow(rowId);
}

function closeDownloadMessageForm() {
    PF('exportMessage').hide();
}

function resetPagination(widgetId) {
    PF(widgetId).getPaginator().setPage(0);
}

function autoSelectOrgan() {
    if ($("#form\\:submitOrganWithSign").length > 0) {
        $("#form\\:submitOrganWithSign").click();
    } else {
        $("#form\\:submitOrgan").click();
    }
}

document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.altKey && e.keyCode === 76) {//76 == l button
        addScreenshot();
    }
});


function addScreenshot() {
    var input = document.getElementById('screenshotForm:input');
    var btn = document.getElementById('screenshotForm:btn');
    if (!input) console.log("can't find screenshot input");
    if (!btn) console.log("can't find screenshot btn");
    if (!(input && btn)) return;

    var origTitle = document.title;
    document.title = 'готовится скриншот для отправки';
    html2canvas(document.body, {onrendered: function (canvas) {
        input.value = canvas.toDataURL('image/png');
        btn.click();
        document.title = origTitle;
    }});
}

// не сработает для ленивых элементов типа p:panel - там нужен oncomplete
$(window).on('load', function () {
    hightligtnElement();
});

// вызов подсветки xml. Подсвечитваются только <textarea>, содержащие класс "hightlight", либо напрямую отмеченные id=masterISOXML
function hightligtnElement() {
    $('textarea.hightlight, #masterISOXML').replaceWith(function () {
        var html = $(this)[0].innerHTML;
        html = hightlight(html);

        return $('<pre />').html(html);
    });
}

// функция подсветки. Порядок .replace важен! todo(мб, когда-нибудь): сделать нормальный анализатор
function hightlight(html) {
    html = html
        .replace(/(\&lt;\?.*\?\&gt;)/, '<span class="tag">$1</span>')
        .replace(/(.*)/gi, '<span class="content">$1</span>')
        .replace(/(\&lt;\/?\w+\/?\&gt;)/gi, '<span class="tag">$1</span>')
        .replace(/(\&lt;\/|\&gt;|\/\&gt;|\&lt;)/gi, '<span class="arr">$1</span>')
        .replace(/\t/g, '    ');
    return html;
}

var uTableSelectedColumns = null;

// created by Egor Pashkovskiy
// https://stackoverflow.com/questions/6219687/why-windows-onload-is-executed-several-times
// причина обертки "$(window).on('load'..." в "$(function..." в том, что первое window.load может ничего не содержать
// в таких случаях, remoteCommand" вызывалась раньше, чем отрабатывал preRender в TableUnit
$(function () {
   startPreRender();
});

function startPreRender() {
    $(window).on('load', initTableSelectedColumns);
}

// для принудительного вызова инициализации uTableSelectedColumns
function initTableSelectedColumns() {
    uTableSelectedColumns = {};

    $('.columnSelector').each(function () {
        var key = $(this).attr('id');
        uTableSelectedColumns[key] = $(this).find(".ui-selectcheckboxmenu-checked").children().text();
    });
}

$(document).mouseup(function(e) {
    setTimeout(updateUTable, 200); // таймаут, т.к. при быстром клике columnSelector не успевает прставить себе ':hidden'
});

function updateUTable() {
    $('.columnSelector').each(function() {
        var key = $( this ).attr('id');
        var val = $( this ).find(".ui-selectcheckboxmenu-checked").children().text();

        // Проверка сделана для предотвращения ошибки,
        // т.к. uTableSelectedColumns[key] заполняется значением с предыдущей страницы, которое undefined.
        if ($( this ).is(':hidden') && uTableSelectedColumns[key] !== undefined
            && uTableSelectedColumns[key] !== val) {

            var arrId = key.split(':'); // примерный результат: [other_stuff, TABLE_ID, columnSelector_panel]
            var targetTableId = arrId[arrId.length-2];
            window[targetTableId+'_leaveColumnSelector']();

            uTableSelectedColumns[key] = val;
        }
    });
}

function hideUrlMail(){
    PF('sendScreenConfirmDialog').hide();
    console.log('hide');
    document.getElementById('fSendMail:sendMail').style.display = 'none';
    document.getElementById('fSendMail:mailSent').style.display = 'inline';
    console.log('change style');
    addScreenshot();
    PF('screenshotSent').show();
}

var lastEvent;
function onContextMenuStart() {
    PF('contextMenu').show = function (h) {
        lastEvent = h;
        h.preventDefault();
    };
}
function onContextMenuComplete() {
    var contextMenu = PF('contextMenu');
    delete contextMenu.show;
    contextMenu.show(lastEvent);
    lastEvent = undefined;
}