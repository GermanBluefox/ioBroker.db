(function ($) {
$(document).ready(function () {

    $('#tabs').tabs();
    $('#tabs ul.ui-tabs-nav').prepend('<li class="header">ioBroker</li>');

    var $gridObjects = $('#grid-objects');
    $gridObjects.jqGrid({
        datatype: 'local',
        colNames:['id','name', 'type'],
        colModel :[
            {name:'_id', index:'_id', width: 360, fixed: true},
            {name:'name', index:'name'},
            {name:'type', index:'type', width: 120, fixed: true}
        ],
        pager: $('#pager-objects'),
        rowNum: 100,
        rowList: [20,50,100],
        sortname: "id",
        sortorder: "desc",
        viewrecords: true,
        caption: 'ioBroker Objects',
        subGrid: true,
        subGridRowExpanded: function (grid, row) {
            subGridObjects(grid, row, 1);
        },
        afterInsertRow: function(rowid) {
            if (!children[rowid.slice(7)]) {
                $('td.sgcollapsed','[id="' +rowid + '"').empty().unbind('click');
            }
        }
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch: true,
        searchOnEnter: false,
        enableClear: false
    });
    
    var $gridStates = $('#grid-states');
    $gridStates.jqGrid({
        datatype: 'local',
        colNames:['id','val', 'ack', 'ts', 'lc'],
        colModel :[
            {name:'_id', index:'_id', width: 300},
            {name:'val', index:'ack', width: 70},
            {name:'ack', index:'ack', width: 70},
            {name:'ts', index:'ts', width: 100},
            {name:'lc', index:'lc', width: 100}
        ],
        pager: $('#pager-states'),
        rowNum: 100,
        rowList: [20,50,100],
        sortname: "id",
        sortorder: "desc",
        viewrecords: true,
        caption: 'ioBroker States'
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch: true,
        searchOnEnter: false,
        enableClear: false
    });

    var socket = io.connect();

    socket.on('stateChange', function (id, obj) {
        var row = '<tr><td>stateChange</td><td>' + id + '</td><td>' + JSON.stringify(obj) + '</td></tr>';
        $('#events').prepend(row);
    });
    socket.on('objectChange', function (id, obj) {
        var row = '<tr><td>objectChange</td><td>' + id + '</td><td>' + JSON.stringify(obj) + '</td></tr>';
        $('#events').prepend(row);
    });

    socket.on('connect', function () {
        getStates();
        getObjects();
    });

    function getStates(callback) {
        $("#load_grid-states").show();
        socket.emit('getForeignStates', '*', function (err, res) {
            var i = 0;
            for (var key in res) {
                var obj = res[key];
                obj._id = key;
                $gridStates.jqGrid('addRowData', 'state_' + key, obj);
            }
            $gridStates.trigger('reloadGrid');
            if (typeof callback === 'function') callback();
        });
    }

    var children = {};
    var toplevel = [];

    function getObjects(callback) {
        $("#load_grid-objects").show();
        socket.emit('getObjectList', {include_docs:true}, function (err, res) {
            for (var i = 0; i < res.rows.length; i++) {
                var obj = res.rows[i].doc;
                if (obj._id.slice(0, 7) === '_design') continue;
                if (obj.parent) {
                    if (!children[obj.parent]) children[obj.parent] = [];
                    children[obj.parent].push(obj);
                } else {
                    toplevel.push(obj);
                }

            }

            for (var i = 0; i < toplevel.length; i++) {
                $gridObjects.jqGrid('addRowData', 'object_' + toplevel[i]._id, toplevel[i]);
            }

            $gridObjects.trigger('reloadGrid');
            if (typeof callback === 'function') callback();
        });
    }

    function subGridObjects(grid, row, level) {
        var id = row.slice(7);
        var subgridTableId = grid + '_t';
        $('[id="' + grid + '"]').html('<table class="subgrid-level-' + level + '" id="' + subgridTableId + '"></table>');
        var $subgrid = $('table[id="' + subgridTableId + '"]');
        var gridConf = {
            datatype: 'local',
            colNames:['id','name', 'type'],
            colModel :[
                {name:'_id', index:'_id', width: 360 - (level * 27), fixed: true},
                {name:'name', index:'name'},
                {name:'type', index:'type', width: 120 - (level * 2), fixed: true}
            ],
            rowNum: 1000000,
            autowidth: true,
            height: 'auto',
            width: 1200,
            //sortname: '_id',
            //sortorder: 'desc',
            viewrecords: true,
            sortorder: 'desc',
            ignoreCase: true,
            subGrid: true,
            subGridRowExpanded: function (grid, row) {
                subGridObjects(grid, row, level + 1);
            },
            afterInsertRow: function (rowid) {
                if (!children[rowid.slice(7)]) {
                    $('td.sgcollapsed','[id="' +rowid + '"').empty().unbind('click');
                }
            },
            gridComplete: function () {
                $subgrid.parent().parent().parent().find('table.ui-jqgrid-htable').hide();
            }
        };

        $subgrid.jqGrid(gridConf);
        for (var i = 0; i < children[id].length; i++) {
            $subgrid.jqGrid('addRowData', 'object_' + children[id][i]._id, children[id][i]);
        }

        $subgrid.trigger('reloadGrid');


    }


    function resizeGrids() {
        var x = $(window).width();
        var y = $(window).height();
        if (x < 720) { x = 720; }
        if (y < 480) { y = 480; }
        $('#grid-states').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-objects').setGridHeight(y - 150).setGridWidth(x - 20);
        $('.subgrid-level-1').setGridWidth(x - 67);
        $('.subgrid-level-2').setGridWidth(x - 94);
    }
    resizeGrids();
    $(window).resize(function() {
        resizeGrids();
    });

});
})(jQuery);

