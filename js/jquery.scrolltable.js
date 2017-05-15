
/*
 * JQuery scrolltable core v0.0.01
 *
 * Copyright (c) 2017 Jian.Ma
 *
 * Licensed same as jquery - MIT License
 * http://www.opensource.org/licenses/mit-license.php
 *
 * email: 18551750323@163.com
 * Begin date: 2017-05-15
 */

;(function(factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else {
        factory(jQuery);
    }
}(function($) {
    function ScrollTable(options) {
        var defaultOptions = {
            heads: [],
            sizes: [],
            styles: [],
            callbacks: {
                onClick: null
            },
            perHeight: 32,
            theme: "dark"
        }

        this.options = $.extend(defaultOptions, options);

        this.data = {
            nodes: [],
            visibleNodes: {
                start: 0,
                end: 0
            }
        }
        this.selectId = -1;
        this.isShowScrollbar = false;
        this.namespace = "scrolltable";

        this.show = function() {
            this._initDom();
            this._initScrollBar();
            this._bindEvent();
        };

        this.insertItem = function(node) {
            this._insertNodeData(node);
            this._updateHeight();
            this._updateVisibleNodes();
        };

        this.insertItems = function(nodes) {
            if (!$.isArray(nodes)) {
                return;
            }

            for (var i = 0,len = nodes.length; i < len; i++) {
                this._insertNodeData(nodes[i]);
            }

            this._updateHeight();
            this._updateVisibleNodes();
        };

        this.replaceItems = function(nodes) {
            var t = this;
            this.clean();
            this.insertItems(nodes);
            this.options.container.find(".table-body").mCustomScrollbar("scrollTo", "top");
            setTimeout(function() {
                t._updateTableTop();
            }, 80);
        };

        this.clean = function() {
            this.options.container.find(".table-body .table-body-holder").empty();
            this._clearNodeData();
        };

        this.focusToNext = function() {
            var nextId = 0;
            if (this.selectId <= -1) {
                nextId = 0;
            } else if (this.selectId >= this.data.nodes.length-1) {
                return;
            } else {
                nextId = this.selectId + 1;
            }

            this._selectItemById(nextId);
            this._skipToItemById(nextId);
        };

        this.get = function(option) {
            switch(true) {
                case option == "focusIndex":
                    return this.selectId;
                    break;
                default:
                    break;
            }
        };

        this._bindEvent = function() {
            var t = this;
            this.options.container.off("click." + this.namespace, ".table-body-holder tr")
            .on("click." + this.namespace, ".table-body-holder tr", function() {
                var id = $(this).data("id");
                t._selectItemById(id);
                if (typeof t.options.callbacks.onClick == "function") {
                    t.options.callbacks.onClick.apply("", [id, this]);
                }
            })
        };

        this._clearNodeData = function() {
            this.data = {
                nodes: [],
                visibleNodes: {
                    start: 0,
                    end: 0
                }
            }
            this.selectId = -1;
        };

        this._genItem = function(item) {
            if (!item || !$.isArray(item.texts)) {
                return '';
            }

            var sizes = this.options.sizes,
                styles = this.options.styles,
                texts = item.texts,
                style = '',
                itemEl = '',
                $item = null;

            for (var i = 0,len = texts.length; i < len; i++) {
                style = styles[i] || ("item_" + i);
                itemEl += '<td class="'+style+'" title="'+texts[i]+'" width="'+sizes[i]+'">'+texts[i]+'</td>';
            }

            return '<tr data-id="'+item._id+'" class="'+(item.style||'')+'">'+itemEl+'</tr>';
        };

        this._getHeight = function() {
            return this.options.perHeight * this.data.nodes.length;
        };

        this._getVisibleNodes = function() {
            var startNode = 0, endNode = 0;
            var totalNum = this.data.nodes.length;
            var rect = this.options.container.find(".table-body")[0].getBoundingClientRect();
            var totalHeight = this.options.container.find(".table-body").height();
            var wrapRect = this.options.container.find(".table-body .table-body-container")[0].getBoundingClientRect();

            if (this._getHeight() <= totalHeight) {
                startNode = 0;
            } else {
                startNode = Math.abs(Math.ceil((wrapRect.top-rect.top) / this.options.perHeight));
            }
            startNode = startNode >= 0 ? startNode : 0;
            endNode = Math.ceil(totalHeight / this.options.perHeight) + startNode - 1;
            endNode = endNode >= totalNum ? totalNum-1 : endNode;
            this.data.visibleNodes = {
                start: startNode,
                end: endNode
            }
        };

        this._initDom = function() {
            if (this.options.heads.length === 0) {
                return;
            }

            var sizes = this.options.sizes,
                heads = this.options.heads,
                strEl = '',
                strHeadEl = '',
                themeStyle = "theme-" + this.options.theme;

            for (var i = 0,len = heads.length; i < len; i++) {
                strHeadEl += '<td width="'+sizes[i]+'">'+heads[i]+'</td>';
            }

            strEl = '' +
            '<div class="scroll-table '+themeStyle+'">' +
            '   <div class="table-head">' +
            '       <table>' +
            '          <tr>'+strHeadEl+'</tr>' +
            '       </table>' +
            '   </div>' +
            '   <div class="table-body"><div class="table-body-container">' +
            '       <table class="table-body-holder"></table>' +
            '   </div></div>' +
            '</div>';

            $(strEl).appendTo(this.options.container);
        };

        this._initScrollBar = function() {
            var t = this;
            this.options.container.find(".table-body").mCustomScrollbar({
                theme: "smartTree",
                axis: "y",
                scrollInertia: 0,
                mouseWheel: {
                    scrollAmount: this.options.perHeight * 3
                },
                scrollButtons: {
                    enable: true,
                    scrollSpeed: this.options.perHeight,
                    scrollAmount: this.options.perHeight
                },
                callbacks: {
                    onShow: function() {
                        t.options.container.find(".scroll-table").addClass("show-scrollbar");
                        t.isShowScrollbar = true;
                        t._updateOnScroll();
                    },
                    onHide: function() {
                        t.options.container.find(".scroll-table").removeClass("show-scrollbar");
                        t.isShowScrollbar = false;
                        t._updateOnScroll();
                    },
                    whileScrolling: function(e) {
                        t._updateOnScroll();
                    },
                    whileScrollingInterval: 30
                }
            });
        };

        this._insertNodeData = function(item) {
            var _nodeData = $.extend(true, {}, item);
            _nodeData._top = this.options.perHeight * this.data.nodes.length;
            _nodeData._id = this.data.nodes.length;
            this.data.nodes.push(_nodeData);
        };

        this._render = function() {
            var displayObj = null;
            this.options.container.find(".table-body .table-body-holder").empty();
            /**
             * create tree node element when it is going to display
             */
            for (var i = this.data.visibleNodes.start; i <= this.data.visibleNodes.end; i++) {
                var node = this.data.nodes[i];
                if (!node.treeNode) {
                    node.treeNode = $(this._genItem(node));
                }
                displayObj = displayObj ? displayObj.add(node.treeNode) : node.treeNode;
            }
            this.options.container.find(".table-body .table-body-holder").append(displayObj);
        };

        this._selectItemById = function(id) {
            var focusNode = this.data.nodes[this.selectId];
            var node = this.data.nodes[id];
            // invalid node
            if (!node.treeNode) {
                return;
            }

            if (focusNode == undefined ||
                focusNode == -1 ||
                !focusNode.treeNode) {

                node.treeNode.addClass("selected");
                this._setFocusNode(id);
            } else {
                if (focusNode != node) {
                    focusNode.treeNode.removeClass("selected");
                    node.treeNode.addClass("selected");
                    this._setFocusNode(id);
                } else {
                    node.treeNode.addClass("selected");
                }
            }
        };

        this._setFocusNode = function(id) {
            this.selectId = id;
        };

        this._skipToItemById = function(id) {
            if (this.isShowScrollbar &&
                (id < this.data.visibleNodes.start || id >= this.data.visibleNodes.end-1)) {
                this.options.container.find(".table-body").mCustomScrollbar("scrollTo", (id + 1) * this.options.perHeight);
            }
        };

        this._updateTableTop = function() {
            var top = 0;
            if (this.data.visibleNodes.end === this.data.nodes.length-1) {
                top = this._getHeight() - (this.data.visibleNodes.end - this.data.visibleNodes.start + 1) * this.options.perHeight;
            } else {
                top = -this.options.container.find(".mCSB_container")[0].offsetTop;
            }
            this.options.container.find(".table-body .table-body-holder").css({
                'top': top
            })
        };

        this._updateHeight = function() {
            this.options.container.find(".table-body .table-body-container").height(this._getHeight());
        };

        this._updateVisibleNodes = function() {
            this._getVisibleNodes();
            this._render();
        };

        this._updateOnScroll = function() {
            this._updateVisibleNodes();
            this._updateTableTop();
        };
    };

    $.fn.ScrollTable = function(params) {
        var el = this[0];
        
        if (!el) {
            return;
        }
        
        if (typeof(params) == "string") {
            switch (true) {
                case params == "show":
                    el.scrolltable.show();
                    break;
                case params == "insertItem":
                    if (arguments.length > 1) {
                        el.scrolltable.insertItem(arguments[1]);
                    }
                    break;
                case params == "insertItems":
                    if (arguments.length > 1) {
                        el.scrolltable.insertItems(arguments[1]);
                    }
                    break;
                case params == "replaceItems":
                    if (arguments.length > 1) {
                        el.scrolltable.replaceItems(arguments[1]);
                    }
                    break;
                case params == "clean":
                    el.scrolltable.clean();
                    break;
                case params == "focusToNext":
                    el.scrolltable.focusToNext();
                    break;
                case params == "get":
                    if (typeof arguments[1] === "string") {
                        return el.scrolltable.get(arguments[1]);
                    }
                    break;
                default:
                    break;
            }
        } else if (typeof(params) == "object") {
            params.container = this;
            el.scrolltable = new ScrollTable(params);
        }
        return this;
    }
}));
