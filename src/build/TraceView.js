'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _d = require('d3');

var d3 = _interopRequireWildcard(_d);

require('./../sass/trace.scss');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TraceView = function (_React$Component) {
    _inherits(TraceView, _React$Component);

    function TraceView(props) {
        _classCallCheck(this, TraceView);

        var _this = _possibleConstructorReturn(this, (TraceView.__proto__ || Object.getPrototypeOf(TraceView)).call(this, props));

        _this.state = {
            componentPainted: false
        };

        _this.d3Ref = _react2.default.createRef();

        _this.paintMindMap = _this.paintMindMap.bind(_this);
        _this.loadJSON = _this.loadJSON.bind(_this);
        _this.getNodeWidth = _this.getNodeWidth.bind(_this);
        _this.getNodeHeight = _this.getNodeHeight.bind(_this);

        _this.constants = {
            translate: "translate("
        };
        return _this;
    }

    _createClass(TraceView, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            this.paintMindMap();
        }
    }, {
        key: 'render',
        value: function render() {
            if (Object.keys(this.props).length === 0 || !this.props.traceConfig) {
                return false;
            }

            var w_style = {
                height: "100%",
                width: '100%'
            };

            return _react2.default.createElement('div', { className: 'trace_view_cnt', ref: this.d3Ref, style: w_style });
        }
    }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate() {
            if (this.state.componentPainted) {
                this.nodeData = {
                    width: this.props.traceConfig.nodeWidth || this.props.nodeWidth,
                    height: this.props.traceConfig.nodeHeight || this.props.nodeHeight
                };

                this.compData = Object.assign({}, this.compData, {
                    width: this.d3CompBody.node().offsetWidth - this.nodeData.width * 2,
                    height: this.d3CompBody.node().offsetHeight,
                    root: undefined
                });

                this.loadJSON();
            }
        }
    }, {
        key: 'paintMindMap',
        value: function paintMindMap() {
            this.setTraceMetaData();
            this.createParentTree();

            this.setState({
                componentPainted: true
            });
        }
    }, {
        key: 'createParentTree',
        value: function createParentTree() {
            var tree = d3.tree();
            var diagonal = d3.linkHorizontal().x(function (d) {
                return d.y;
            }).y(function (d) {
                return d.x;
            });

            this.compData.tree = tree;
            this.compData.connector = diagonal;

            this.d3CompBody.append("svg:svg").attr("width", this.compData.width + this.nodeData.width * 2).attr("height", this.compData.height - (5 + this.margin.top + this.margin.bottom)).append("svg:g").attr("transform", this.constants.translate + (this.compData.width / 2 + this.nodeData.width) + "," + 0 + ")").attr('class', 'node_group');
        }
    }, {
        key: 'loadJSON',
        value: function loadJSON() {
            var json = this.props.traceConfig.data;
            this.compData.height = json.children ? this.nodeData.height / 1.7 * json.children.length : 0;
            this.compData.linkColor = '#3d6298' || this.traceConfig.linkColor;

            if (this.compData.height < this.d3Ref.current.offsetHeight) {
                this.compData.height = this.d3Ref.current.offsetHeight - 5;
                this.margin.top = 0;
                this.margin.bottom = 0;
            } else {
                this.margin.top = 20;
                this.margin.bottom = 10;
            }

            //this.compData.height += this.margin.top + this.margin.bottom;

            this.d3CompBody.select('svg').attr("height", this.compData.height + this.margin.top + this.margin.bottom);

            json = JSON.parse(JSON.stringify(json));

            var i = 0;
            var l = json.children ? json.children.length : 0;

            this.compData.root = json;

            json.left = [];
            json.right = [];

            for (; i < l; i++) {
                if (i % 2) {
                    json.left.push(json.children[i]);
                    json.children[i].position = 'left';
                } else {
                    json.right.push(json.children[i]);
                    json.children[i].position = 'right';
                }
            }

            this.update(this.compData.root, true);
            this.selectNode(this.compData.root);
        }
    }, {
        key: 'update',
        value: function update(source) {
            var _this2 = this;

            var nodeGroup = this.d3CompBody.select('.node_group').attr("transform", this.constants.translate + (this.compData.width / 2 + this.nodeData.width) + "," + this.margin.top + ")");

            var that = this;
            // Compute the new tree layout.
            var leftTreeData = Object.assign({}, source, {
                children: source.left
            });

            var rightTreeData = Object.assign({}, source, {
                children: source.right
            });

            delete leftTreeData.right;
            delete leftTreeData.left;
            delete rightTreeData.right;
            delete rightTreeData.left;

            var leftHeirarchieNodes = d3.hierarchy(leftTreeData);
            var rightHeirarchieNodes = d3.hierarchy(rightTreeData);

            var leftTree = this.compData.tree.size([this.compData.height, this.compData.width / 2 - this.margin.left]);
            var rightTree = this.compData.tree.size([this.compData.height, this.compData.width / 2 - this.margin.right]);

            // maps the node data to the tree layout
            leftTree(leftHeirarchieNodes);
            rightTree(rightHeirarchieNodes);

            if (leftHeirarchieNodes.children) {
                leftHeirarchieNodes.children = leftHeirarchieNodes.children.concat(rightHeirarchieNodes.children);
            } else {
                leftHeirarchieNodes.children = rightHeirarchieNodes.children;
            }

            leftHeirarchieNodes.data.children = leftHeirarchieNodes.data.children.concat(rightHeirarchieNodes.data.children);

            this.compData.root = leftHeirarchieNodes;
            this.compData.root._children = null;

            this.changeLeftNodesY(this.compData.root);

            // Normalize for fixed-depth.
            //nodes.forEach(function(d) { d.y = d.depth * 180; });

            // Update the nodes…
            var node = nodeGroup.selectAll("g.node").data(this.compData.root.descendants(), function (d) {
                return d.id || (d.id = ++_this2.compData.index);
            });

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter().append("svg:g").attr("class", function (d) {
                var nodeCls = d.selected ? "node selected" : "node";

                if (d.depth === 0) {
                    nodeCls += ' root_node';
                }

                return nodeCls;
            }).attr("transform", function (d) {
                return _this2.constants.translate + d.y + "," + d.x + ")";
            });

            var connectorNodeGap = 20;
            var rectWidthPos = -(this.nodeData.width / 2);
            var nodeConnector = [{
                x: rectWidthPos - connectorNodeGap,
                y: 0
            }, {
                x: rectWidthPos + this.nodeData.width + connectorNodeGap,
                y: 0
            }];

            var line = d3.line().x(function (d) {
                return d.x;
            }).y(function (d) {
                return d.y;
            });

            var connectorLineData = [{
                x: nodeConnector[0].x,
                y: nodeConnector[0].y
            }, {
                x: nodeConnector[1].x,
                y: nodeConnector[1].y
            }];

            this.d3CompBody.selectAll(".root_node").append('path').data(connectorLineData).attr('d', line(connectorLineData)).attr('class', 'root_connector_line').style('stroke', '#3d6298').style('stroke-width', '1px').style('fill', 'none');

            nodeEnter.append("svg:foreignObject").transition().duration(1200).attr("width", this.getNodeWidth).attr("height", this.getNodeHeight).attr("x", function (d) {
                var w_nodeWidth = that.getNodeWidth(d);
                var xPos = -(w_nodeWidth / 2);

                if (!d.children && d.depth !== 0) {
                    var position = d.data.position;

                    if (position === 'right') {
                        xPos = 0;
                    } else {
                        xPos = -that.nodeData.width;
                    }
                }

                return xPos;
            }).attr("y", function (d) {
                var w_nodeHeight = that.getNodeHeight(d);

                return -(w_nodeHeight / 2);
            }).attr("fk", function (d) {
                if (that.props.node) {
                    var nodeConfig = that.props.nodeConfig || {};

                    _reactDom2.default.render(_react2.default.createElement(that.props.node, _extends({ store: that.props.store, cardConfig: d.data }, nodeConfig)), this);
                }
            });

            // Transition exiting nodes to the parent's new position.
            node.exit().attr("transform", function (d) {
                return _this2.constants.translate + d.y + "," + d.x + ")";
            }).remove();

            nodeConnector.forEach(function (nc, i) {
                var circleFill = '#ffffff';
                var circleClass = 'root_connector';

                if (i === 0 & (!that.compData.root.children || that.compData.root.children.findIndex(function (nodeItem) {
                    return nodeItem.data.position === 'left';
                }) === -1) || i === 1 & (!that.compData.root.children || that.compData.root.children.findIndex(function (nodeItem) {
                    return nodeItem.data.position === 'right';
                }) === -1)) {
                    circleFill = '#2979ff';
                    circleClass = ' empty_node_circle';
                }

                that.d3CompBody.select(".root_node").append('circle').attr('class', circleClass).attr("r", 4.5).attr("cx", nc.x).style("fill", circleFill).style("stroke", '#3d6298').style("stroke-width", '1px').attr("cy", nc.y);
            });

            nodeGroup.selectAll("path.link").remove();

            // Update the links…
            var link = nodeGroup.selectAll("path.link").data(this.compData.root.links()).enter().append("svg:path").attr("class", "link").attr("d", function (d) {
                return that.linkPathFn(d, nodeConnector);
            })
            //.style('fill', 'none')
            .style('stroke', this.compData.linkColor);

            link.exit().remove();
        }
    }, {
        key: 'getNodeWidth',
        value: function getNodeWidth(d) {
            var w_nodeWidth = this.nodeData.width;

            if (d.children && this.props.rootNode && this.props.rootNode.padding) {
                w_nodeWidth += (this.props.rootNode.padding.left || 0) + (this.props.rootNode.padding.right || 0);
            }

            return w_nodeWidth;
        }
    }, {
        key: 'getNodeHeight',
        value: function getNodeHeight(d) {
            var w_nodeHeight = this.nodeData.height;

            if (d.children && this.props.rootNode && this.props.rootNode.padding) {
                w_nodeHeight += (this.props.rootNode.padding.top || 0) + (this.props.rootNode.padding.bottom || 0);
            }

            return w_nodeHeight;
        }
    }, {
        key: 'linkPathFn',
        value: function linkPathFn(d, nodeConnector) {
            var s = { x: d.source.x, y: d.source.y };
            var t = { x: d.target.x, y: d.target.y };

            if (d.target.data.position === 'left') {
                s.y = nodeConnector[0].x - 3.5;
                t.y = t.y - 2;
            } else {
                s.y = nodeConnector[1].x + 3.8;
                t.y = t.y + 2;
            }

            return this.compData.connector({ source: s, target: t });
        }
    }, {
        key: 'changeLeftNodesY',
        value: function changeLeftNodesY(item, d) {
            var dr = d || 1;
            var i = 0;

            var l = item.children ? item.children.length : 0;

            if (item.data && item.data.position === 'left') {
                dr = -1;
            }

            item.y = dr * item.y;

            for (; i < l; i++) {
                this.changeLeftNodesY(item.children[i], dr);
            }
        }
    }, {
        key: 'setTraceMetaData',
        value: function setTraceMetaData() {
            var compBody = this.d3Ref.current;
            this.d3CompBody = d3.select(compBody);

            var sideMargin = compBody.offsetWidth * 0.1;

            this.margin = {
                left: sideMargin,
                right: sideMargin,
                top: 0,
                bottom: 0
            };
            this.nodeData = {
                width: this.props.traceConfig.nodeWidth || this.props.nodeWidth,
                height: this.props.traceConfig.nodeHeight || this.props.nodeHeight
            };
            this.compData = {
                width: compBody.offsetWidth - this.nodeData.width * 2,
                height: compBody.offsetHeight,
                index: 0,
                root: undefined
            };
        }
    }, {
        key: 'selectNode',
        value: function selectNode(target) {
            if (target) {
                var sel = this.d3CompBody.selectAll('.node').filter(function (d) {
                    return d.id === target.id;
                }).nodes()[0];

                if (sel) {
                    this.select(sel);
                }
            }
        }
    }, {
        key: 'select',
        value: function select(node) {
            // Find previously selected, unselect
            this.d3CompBody.select(".selected").classed("selected", false);
            // Select current item
            d3.select(node).classed("selected", true);
        }
    }]);

    return TraceView;
}(_react2.default.Component);

exports.default = TraceView;