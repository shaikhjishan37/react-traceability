import React from 'react';
import ReactDOM from 'react-dom';
import * as d3 from "d3";
import './../sass/trace.scss';

class TraceView extends React.Component {
	constructor(props) {
		super(props);

        this.state = {
            componentPainted: false
        };

        this.d3Ref = React.createRef();

        this.paintMindMap = this.paintMindMap.bind(this);
        this.loadJSON = this.loadJSON.bind(this);
        this.getNodeWidth = this.getNodeWidth.bind(this);
        this.getNodeHeight = this.getNodeHeight.bind(this);

        this.constants = {
            translate: "translate("
        };
	};

	componentDidMount() {
        this.paintMindMap();
	};
	
	render() {
        if ( Object.keys(this.props).length === 0 || !this.props.traceConfig ) {
			return false;
        }

        const w_style = {
            height: "100%",
            width: '100%'
        };

		return (
            <div className='trace_view_cnt' ref={this.d3Ref} style={w_style}></div>
		);
    };

    componentDidUpdate() {
        if ( this.state.componentPainted ) {
            this.nodeData = {
                width: this.props.traceConfig.nodeWidth || this.props.nodeWidth,
                height: this.props.traceConfig.nodeHeight || this.props.nodeHeight
            };

            this.compData = {
                ...this.compData,
                width: this.d3CompBody.node().offsetWidth - this.nodeData.width * 2,
                height: this.d3CompBody.node().offsetHeight,
                root: undefined
            };

            this.loadJSON();
        }
    };

    paintMindMap() {
        this.setTraceMetaData();
        this.createParentTree();

        this.setState({
            componentPainted: true
        });
    };

    createParentTree() {
        const tree = d3.tree();
        const diagonal = d3.linkHorizontal()
            .x( d => d.y )
            .y( d => d.x );

        this.compData.tree = tree;
        this.compData.connector = diagonal;

        this.d3CompBody.append("svg:svg")
            .attr("width", this.compData.width + this.nodeData.width * 2)
            .attr("height", this.compData.height - (5 + this.margin.top + this.margin.bottom))
            .append("svg:g")
            .attr("transform", this.constants.translate + ( this.compData.width / 2 + this.nodeData.width ) + "," + 0 + ")")
            .attr('class', 'node_group');
    };

    loadJSON() {
        let json = this.props.traceConfig.data;
        this.compData.height = json.children ? ( this.nodeData.height / 1.7 ) * json.children.length : 0;
        this.compData.linkColor = '#3d6298' || this.traceConfig.linkColor;
		
		if ( this.compData.height < this.d3Ref.current.offsetHeight ) {
            this.compData.height = this.d3Ref.current.offsetHeight - 5;
            this.margin.top = 0;
            this.margin.bottom = 0;
		} else {
            this.margin.top = 20;
            this.margin.bottom = 10;
        }

        //this.compData.height += this.margin.top + this.margin.bottom;
		
		this.d3CompBody.select('svg')
		    .attr("height", this.compData.height + this.margin.top + this.margin.bottom);
		
		json = JSON.parse(JSON.stringify(json));
		
        let i = 0;
        const l = json.children ? json.children.length : 0;

        this.compData.root = json;
          
        json.left = [];
        json.right = [];

        for(; i<l; i++) {
            if ( i % 2 ) {
                json.left.push(json.children[i]);
                json.children[i].position = 'left';
            } else {
                json.right.push(json.children[i]);
                json.children[i].position = 'right';
            }
        }

        this.update(this.compData.root, true);
        this.selectNode(this.compData.root);
    };

    update(source) {
        const nodeGroup = this.d3CompBody.select('.node_group')
            .attr("transform", this.constants.translate + ( this.compData.width / 2 + this.nodeData.width ) + "," + this.margin.top + ")");

        const that = this;
        // Compute the new tree layout.
        const leftTreeData = { 
            ...source,
            children: source.left
        };

        const rightTreeData = { 
            ...source,
            children: source.right
        };

        delete leftTreeData.right;
        delete leftTreeData.left;
        delete rightTreeData.right;
        delete rightTreeData.left;

        const leftHeirarchieNodes = d3.hierarchy(leftTreeData);
        const rightHeirarchieNodes = d3.hierarchy(rightTreeData);

        const leftTree = this.compData.tree
          .size([this.compData.height, ( this.compData.width / 2 ) - this.margin.left]);
        const rightTree = this.compData.tree
          .size([this.compData.height, ( this.compData.width / 2 ) - this.margin.right])

        // maps the node data to the tree layout
        leftTree(leftHeirarchieNodes);
        rightTree(rightHeirarchieNodes);
        
        if ( leftHeirarchieNodes.children ) {
            leftHeirarchieNodes.children = leftHeirarchieNodes.children.concat( rightHeirarchieNodes.children );
        } else {
            leftHeirarchieNodes.children = rightHeirarchieNodes.children;
        }
        
        leftHeirarchieNodes.data.children = leftHeirarchieNodes.data.children.concat( rightHeirarchieNodes.data.children );

        this.compData.root = leftHeirarchieNodes
        this.compData.root._children = null;

        this.changeLeftNodesY(this.compData.root);

        // Normalize for fixed-depth.
        //nodes.forEach(function(d) { d.y = d.depth * 180; });

        // Update the nodes…
        const node = nodeGroup.selectAll("g.node")
            .data(this.compData.root.descendants(), d => d.id || (d.id = ++this.compData.index) );

        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter().append("svg:g")
            .attr("class", d => { 
				let nodeCls = d.selected ? "node selected" : "node";
				
				if ( d.depth === 0 ) {
					nodeCls += ' root_node'
				}
				
				return nodeCls;
			})
			.attr("transform", d => this.constants.translate + d.y + "," + d.x + ")");
			
		const connectorNodeGap = 20;
		const rectWidthPos = -(this.nodeData.width / 2);
		const nodeConnector = [{
			x: rectWidthPos - connectorNodeGap,
			y: 0
		}, {
			x: rectWidthPos + this.nodeData.width + connectorNodeGap,
			y: 0
		}];
		
		const line = d3.line()
			.x( d => d.x )
			.y( d => d.y );

		const connectorLineData = [{
			x: nodeConnector[0].x,
			y: nodeConnector[0].y
		}, {
			x: nodeConnector[1].x,
			y: nodeConnector[1].y
		}]
		
		this.d3CompBody.selectAll(".root_node").append('path')
			.data(connectorLineData)
			.attr('d', line(connectorLineData))
			.attr('class', 'root_connector_line')
			.style('stroke', '#3d6298')
			.style('stroke-width', '1px')
			.style('fill', 'none');
			
        nodeEnter.append("svg:foreignObject")
        .transition()
        .duration(1200)
        .attr("width", this.getNodeWidth)
		.attr("height", this.getNodeHeight)
		.attr("x", d => {
            const w_nodeWidth = that.getNodeWidth(d);
			let xPos = -(w_nodeWidth / 2);
			
			if ( !d.children && d.depth !== 0 ) {
				const position = d.data.position;
				
				if ( position === 'right' ) {
					xPos = 0;
				} else {
					xPos = -that.nodeData.width
				}
			}
			
			return xPos;
		})
		.attr("y", function (d) {
            const w_nodeHeight = that.getNodeHeight(d);

            return -( w_nodeHeight / 2 );
        })
        .attr( "fk", function(d) {
            if ( that.props.node ) {
				const nodeConfig = that.props.nodeConfig || {};
				
                ReactDOM.render(
					<that.props.node store={ that.props.store } cardConfig={ d.data } { ...nodeConfig } />,
				this);
            }
        })
			

        // Transition exiting nodes to the parent's new position.
        node.exit()
            .attr("transform", d => this.constants.translate + d.y + "," + d.x + ")" )
            .remove();

		nodeConnector.forEach(function (nc, i) {
			let circleFill = '#ffffff';
			let circleClass = 'root_connector';
			
            if ( (i === 0 & ( !that.compData.root.children ||
                that.compData.root.children.findIndex( nodeItem => nodeItem.data.position === 'left' ) === -1)) 
                || (i === 1 & (!that.compData.root.children ||
                that.compData.root.children.findIndex( nodeItem => nodeItem.data.position === 'right' ) === -1)) ) {
				circleFill = '#2979ff';
				circleClass = ' empty_node_circle';
			}
			
			that.d3CompBody.select(".root_node")
			.append('circle')
			.attr('class', circleClass)
			.attr("r", 4.5)
			.attr("cx", nc.x)
			.style("fill", circleFill)
			.style("stroke", '#3d6298')
			.style("stroke-width", '1px')
			.attr("cy", nc.y);
		});

        nodeGroup.selectAll("path.link").remove();
        
        // Update the links…
        const link = nodeGroup.selectAll("path.link")
            .data(this.compData.root.links())
            .enter()
            .append("svg:path")
            .attr("class", "link")
            .attr("d", d => that.linkPathFn(d, nodeConnector))
            //.style('fill', 'none')
            .style('stroke', this.compData.linkColor);
        
        link.exit().remove();
    };

    getNodeWidth(d) {
        let w_nodeWidth = this.nodeData.width;

        if ( d.children && this.props.rootNode && this.props.rootNode.padding ) {
            w_nodeWidth += ( this.props.rootNode.padding.left || 0 ) + ( this.props.rootNode.padding.right || 0 )
        }

        return w_nodeWidth;
    };

    getNodeHeight(d) {
        let w_nodeHeight = this.nodeData.height;

        if ( d.children && this.props.rootNode && this.props.rootNode.padding ) {
            w_nodeHeight += ( this.props.rootNode.padding.top || 0 ) + ( this.props.rootNode.padding.bottom || 0 )
        }

        return w_nodeHeight;
    };

    linkPathFn(d, nodeConnector) {
        const s = {x: d.source.x, y: d.source.y};
        const t = {x: d.target.x, y: d.target.y};
        
        if ( d.target.data.position === 'left' ) {
            s.y = nodeConnector[0].x - 3.5;
            t.y = t.y - 2;
        } else {
            s.y = nodeConnector[1].x + 3.8;
            t.y = t.y + 2;
        }
        
        return this.compData.connector({source: s, target: t});
    };

    changeLeftNodesY(item, d) {
        let dr = d || 1;
        let i = 0;

        const l = item.children ? item.children.length : 0;

        if ( item.data && item.data.position === 'left' ) {
          dr = -1;
        }

        item.y = dr * item.y;

        for (; i < l; i++) {
          this.changeLeftNodesY(item.children[i], dr);
        }
    };

    setTraceMetaData() {
        const compBody = this.d3Ref.current;
        this.d3CompBody = d3.select(compBody);

        const sideMargin = compBody.offsetWidth * 0.1;

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
    };

    selectNode(target) {
        if ( target ) {
          const sel = this.d3CompBody.selectAll('.node').filter(d => d.id === target.id).nodes()[0];

          if (sel) {
            this.select( sel );
          }
        }
    };

    select( node ) {
        // Find previously selected, unselect
        this.d3CompBody.select(".selected").classed("selected", false);
        // Select current item
        d3.select(node).classed("selected", true);
    };
}

export default TraceView;