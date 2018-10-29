/************************************************
Скрипты позволяющие реализовать растягивание столбцов по ширине контента (не затрагивая пагинатор и панель с кнопками) и "плавающий" горизонтальный сктолл для p:dataTable.
Дополнительные условия: таблица находится внутри объекта с id=layoutUnitContent
Подключение:
0. в css должен существовать стиль, описанный следующим образом (.ui-datatable-scrollable-body - стиль объекта p:dataTable):
.scroll_datatable .ui-datatable-scrollable-body table {
    table-layout:auto;
}
1. добавить стиль scroll_datatable к p:dataTable;
2. подключить скрипты к событиям загрузки и скроллинга
			$(window).load(function() {
                updateScrollTableWidth();
                initScrollPanelHeight();
            });

            document.addEventListener('scroll', function (event) {
                updateScrollTableHeight();
            }, true);
3. подключить нужные функции к другим событиям на форме.
************************************************/
// for style scroll_datatable only

/**
Вычисление и обновление ширины столбцов заголовка и контента для p:dataTable со стилем scroll_datatable
*/
function updateScrollTableWidth() {
    updateScrollTableWidthParam(0);
}

function updateScrollTableWidthParam(addWidth) {

    if (document.querySelectorAll('.no_horizontal_scrollable').length > 0) return;

    var isInit = addWidth > 0;

    var elements_body = document.querySelectorAll('.scroll_datatable .ui-datatable-scrollable-body table');

    if (!elements_body.length)
        return;

    if (isInit) {
        $(elements_body[0]).css({ 'table-layout': "auto" });
    }

    var elements = document.querySelectorAll('.scroll_datatable .ui-datatable-scrollable-header-box table thead tr th');

    if (!elements.length)
        return;

    var elements2 = document.querySelectorAll('.ui-datatable-scrollable-body');
    var scrollWidth = 0;
    if (elements2.length > 0) {
        var table_body = elements2[0];
        scrollWidth = table_body.scrollWidth - table_body.offsetWidth;
        if (scrollWidth > 0 ) {
            // появился скролл
        }
    }

    for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        //var el_title = $(el).querySelector('span');
        var el_clone = document.getElementById(el.id + '_clone');
        
        if (el.className.search('custom_width') > -1 && isInit) {
            continue;
        }
        
        //var width_el = $(el_title).width();
        var width_el = parseInt(document.defaultView.getComputedStyle(el,null).getPropertyValue('width'));
        var width_el_clone = el_clone !== null ? parseInt(document.defaultView.getComputedStyle(el_clone,null).getPropertyValue('width')) : null;


        //var targetWidth = width_el_clone > width_el ? width_el_clone : width_el;
        var targetWidth;
        if (isInit) { //первая прогрузка страницы
            targetWidth = width_el_clone > width_el ? width_el_clone : width_el;
        } else {
            targetWidth = width_el;
        }

        //targetWidth = "250px";//

        if (el_clone !== null) {
            var el_clone_width = targetWidth + addWidth;
            if (i === elements.length-1 && scrollWidth > 0) {
                el_clone_width -= 20;
            }
            el_clone.style.width = el_clone_width + 'px';
        }

        if (isInit) {
            el.style.width = targetWidth + addWidth + /*0.72 + */'px';
        } else {
            el.style.width = targetWidth + addWidth +/* 0.72 +*/ 'px';
        }
    }
    $(elements_body[0]).css({ 'table-layout': "fixed" });
}

/**
Расчёт высоты полотна с контентом внутри скролируемой панельки с id=layoutUnitContent
*/
function getScrollPanelHeight() {
	var visible_panel = document.getElementById('layoutUnitContent');
	
	var elements_scroll_datatable = document.querySelectorAll('.scroll_datatable');
    var table = null;
    if (elements_scroll_datatable.length > 0) {
        table = elements_scroll_datatable[0];
    }
	
	if (!visible_panel || !table)
        return;
	
	// панелька с прокруткой (смещение верхней и нижней части относитьельно верха окна)
    var top_panel = visible_panel.getBoundingClientRect().top;
    var height_panel = parseInt(document.defaultView.getComputedStyle(visible_panel,null).getPropertyValue('height'));
	
	var top_table = table.getBoundingClientRect().top;

	//var heightContent = (top_table - top_panel) + height_panel;
	var top_delta = top_table - top_panel;	
	var heightContent = top_delta + height_panel;
	return heightContent;
}

/**
Инициализация высоты полотна с контентом внутри скролируемой панельки с id=layoutUnitContent
*/
function initScrollPanelHeight() {
	
	var elements_scroll_datatable = document.querySelectorAll('.scroll_datatable');
    var table = null;
    if (elements_scroll_datatable.length > 0) {
        table = elements_scroll_datatable[0];
    }
	
	if (!table)
        return;
	
	var heightContent = getScrollPanelHeight();
	
	var hiddenScrollDatatableDiv = document.querySelectorAll('#hiddenScrollDatatableDiv');
	if ($(hiddenScrollDatatableDiv).length) {
		//$(hiddenScrollDatatableDiv).css("height", (heightContent) + "px");
	} else {
		$(table.parentNode).append("<div id='hiddenScrollDatatableDiv' style='height: " + heightContent + "px;  width: 3px; position: absolute; top: 0;'></div>");
	}
	
	updateScrollTableHeight();
}

/**
Обновление высоты полотна с контентом внутри скролируемой панельки с id=layoutUnitContent
*/
function updateScrollPanelHeight() {
	var heightContent = getScrollPanelHeight();
	
	var hiddenScrollDatatableDiv = document.querySelectorAll('#hiddenScrollDatatableDiv');
	if ($(hiddenScrollDatatableDiv).length) {
		$(hiddenScrollDatatableDiv).css("height", (heightContent) + "px");
		updateScrollTableHeight();
	} else {
		//$(table.parentNode).append("<div id='hiddenScrollDatatableDiv' style='height: " + heightContent + "px;  width: 3px; position: absolute; top: 0px;'></div>");
	} 
}

/**
Вычисление и обновление высоты блока контента (body) для p:dataTable со стилем scroll_datatable
*/
function updateScrollTableHeight() {
    //initScrollPanelHeight();

    var visible_panel = document.getElementById('layoutUnitContent');
    // для того что бы заголовок не уезжал под шапку
    var second_table = document.querySelectorAll('.second_table');
    var second_table_height = 0;
    if (second_table.length > 0) {
        second_table_height = parseInt(document.defaultView.getComputedStyle(second_table[0],null).getPropertyValue('height')) + 10;
    }

    var elements_scroll_datatable = document.querySelectorAll('.scroll_datatable');
    var table = null;
    if (elements_scroll_datatable.length > 0) {
        table = elements_scroll_datatable[0];
    }

    var elements = document.querySelectorAll('.scroll_datatable .ui-datatable-scrollable-header-box');
    var table_header = null;
    if (elements.length > 0) {
        table_header = elements[0];
    }

    var elements1 = document.querySelectorAll('.scroll_datatable .ui-paginator-bottom');
    var table_footer = null;
    if (elements1.length > 0) {
        table_footer = elements1[0];
    }

    var elements2 = document.querySelectorAll('.ui-datatable-scrollable-body');
    var table_body = null;
    if (elements2.length > 0) {
        table_body = elements2[0];
    }

    // если таблица маленькая не фиксируем пагинатор
    var tBody = table_body ? table_body.childNodes[0].childNodes[1] : null;
    // + 1 убирает появление горизонтального скрола при наведении на таблицу. когда он не нужен
    if (tBody) {
        var tBody_height = parseInt(document.defaultView.getComputedStyle(tBody,null).getPropertyValue('height'));
        tBody_height += 1;
    }
    if (!visible_panel || !table_header || !table_footer || !table_body || !table)
        return;

    // панелька с прокруткой (смещение верхней и нижней части относитьельно верха окна)
    var top_panel = visible_panel.getBoundingClientRect().top;
    var height_panel = parseInt(document.defaultView.getComputedStyle(visible_panel,null).getPropertyValue('height'));
    var bottom_panel = top_panel + height_panel;

    //
    var top_table = table.getBoundingClientRect().top;

    // заголовок таблицы со столбцами
    var top_table_header = table_header.getBoundingClientRect().top;
    var height_table_header = parseInt(document.defaultView.getComputedStyle(table_header,null).getPropertyValue('height'));
    var bottom_table_header = top_table_header + height_table_header;
    var height_table_header_all = top_table_header - top_table + height_table_header;

    // пагинатор таблички
    var top_table_footer = table_footer.getBoundingClientRect().top;
    var height_table_footer = parseInt(document.defaultView.getComputedStyle(table_footer,null).getPropertyValue('height'));

    // изменяемый блок таблицы
    var new_top_table_body = top_panel > bottom_table_header ? top_panel : bottom_table_header;
    var new_bottom_table_body = bottom_panel - height_table_footer;

    var newHeight = new_bottom_table_body - new_top_table_body - 15;
    if (document.querySelectorAll('.small_vertical_scroll').length > 0) {
        var maxHeight = new_bottom_table_body - new_top_table_body;
    } else if (tBody_height + second_table_height + height_table_footer + height_table_header + 100 < height_panel){
        var maxHeight = tBody_height + 20;
    } else {
        var maxHeight = height_panel - height_table_header_all - height_table_footer - 35 - second_table_height;
    }

    table_body.style.height =(newHeight < 150 ? 150 : newHeight > maxHeight ? maxHeight : newHeight) + 'px';
}