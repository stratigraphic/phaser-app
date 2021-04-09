<template>
<b-overlay :show="busy" rounded="sm">	
	<!--cytoscape graph-->
    <div id="holder" class="overflow-auto"> 
        <div class="position-relative">             
            <Lock 
                class="position-absolute m-2" 
                style="{ top: 0; left: 0; z-index: 100; }"                
                v-model="locked" @input="lockChanged"/>
            <Legend class="position-absolute m-2" 
                style="{ top: 0; right: 0; z-index: 100; }" />
             
        </div>
        
        <cytoscape id="diagram" 
            ref="cy" 
            :config="config" 
            :preConfig="preConfig" 
            :afterCreated="afterCreated">            
           
            <cy-element v-for="node in nodes"
                :key="`${node.data.id}`"
                :definition="node"
                v-on:click="elementSelected($event, node)"
                :sync="true"/>
            
            <cy-element v-for="edge in edges"
                :key="`${edge.data.id}`"
                :definition="edge"
                v-on:click="elementSelected($event, edge)"/>            
        </cytoscape>
    </div>
</b-overlay>	
</template>

<script>

import dagre from 'cytoscape-dagre'
import elk from 'cytoscape-elk'
import klay from 'cytoscape-klay'
import gridGuide from 'cytoscape-grid-guide'
import cyCanvas from 'cytoscape-canvas'
import panzoom from 'cytoscape-panzoom'
import $ from 'jquery'

import moment from 'moment'
import PhaserCommon from '@/mixins/PhaserCommon.js'
import Legend from '@/components/Legend'
import Lock from '@/components/Lock'

export default {
	name: 'MatrixDiagramCY',
	components: {
		Legend, 
        Lock 
	},
	mixins: [ PhaserCommon ],
	props: { 
        gridSize: {
            type: Number,
            required: false,
            default: 40
        }
    },
	data() {
        return {
            container: "cy",
            busy: false,
            locked: true,
            config: {  
                panzoom: {
                    zoomFactor: 0.05, // zoom factor per zoom tick
                    zoomDelay: 45, // how many ms between zoom ticks
                    minZoom: 0.05, // min zoom level
                    maxZoom: 2, // max zoom level
                    fitPadding: 50, // padding when fitting
                    panSpeed: 20, // how many ms in between pan ticks
                    panDistance: 20, // max pan distance per tick
                    panDragAreaSize: 75, // the length of the pan drag box in which the vector for panning is calculated (bigger = finer control of pan speed and direction)
                    panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
                    panInactiveArea: 8, // radius of inactive area in pan drag box
                    panIndicatorMinOpacity: 0.5, // min opacity of pan indicator (the draggable nib); scales from this to 1.0
                    zoomOnly: false, // a minimal version of the ui only with zooming (useful on systems with bad mousewheel resolution)
                    fitSelector: undefined, // selector of elements to fit
                    animateOnFit: function(){ // whether to animate on fit
                        return false;
                    },
                    fitAnimationDuration: 1000, // duration of animation on fit

                    // icon class names
                    sliderHandleIcon: 'fa fa-minus',
                    zoomInIcon: 'fa fa-plus',
                    zoomOutIcon: 'fa fa-minus',
                    resetIcon: 'fa fa-expand'
                },                            
                layoutDagre: {
                    name: 'dagre', 
                    // dagre options, uses default value if undefined
                    nodeSep: this.gridSize - 4, // the separation between adjacent nodes in the same rank
                    //edgeSep: 20, // the separation between adjacent edges in the same rank                    
                    rankSep: this.gridSize - 4, // the separation between each rank in the layout
                    marginx: this.gridSize / 2,
                    marginy: this.gridSize / 2,                    
                    rankDir: 'TB', // 'TB' for top to bottom flow, 'LR' for left to right
                    ranker: 'network-simplex', // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
                    //minLen: function( edge ){ return 1; }, // number of ranks to keep between the source and target of the edge
                    //edgeWeight: function( edge ){ return 1; }, // higher weight edges are generally made shorter and straighter than lower weight edges

                    // general layout options
                    fit: false, // whether to fit to viewport
                    padding: this.gridSize / 2, // fit padding
                    spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
                    nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
                    animate: false, // whether to transition the node positions
                    boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                    //transform: function( node, pos ){ return pos; }, // a function that applies a transform to the final node position
                    //zoom: function(e){ console.log("zoom"); console.log(e)},
                    //viewport: function(e){ console.log("viewport"); console.log(e)},
                    ready: function(){}, // on layoutready
                    stop: this.layoutStop // on layoutstop              
                },
                layoutElk: {
                    name: "elk",
                    nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
                    fit: false, // Whether to fit
                    padding: this.gridSize / 2, // Padding on fit
                    animate: false, // Whether to transition the node positions
                    animationDuration: 500, // Duration of animation in ms if enabled
                    animationEasing: undefined, // Easing of animation if enabled
                    transform: function( node, pos ){ return pos; }, // A function that applies a transform to the final node position
                    ready: undefined, // Callback on layoutready
                    stop: undefined, // Callback on layoutstop
                    elk: {
                        // All options are available at http://www.eclipse.org/elk/reference.html
                        // 'org.eclipse.elk.' can be dropped from the Identifier
                        // Or look at demo-demo.js for an example.
                        // Enums use the name of the enum e.g.
                        // 'searchOrder': 'DFS'
                        //
                        // The main field to set is `algorithm`, which controls which particular
                        // layout algorithm is used.
                        algorithm: "stress" // box disco force layered mrtree random stress
                    }                
                },
                layoutKlay: {
                    name: "klay",                    
                    nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
                    fit: false, // Whether to fit
                    padding: this.gridSize / 2, // Padding on fit
                    animate: false, // Whether to transition the node positions
                    animateFilter: function( ){ return true; }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
                    animationDuration: 500, // Duration of animation in ms if enabled
                    animationEasing: undefined, // Easing of animation if enabled
                    transform: function( node, pos ){ return pos; }, // A function that applies a transform to the final node position
                    ready: undefined, // Callback on layoutready
                    stop: undefined, // Callback on layoutstop
                    klay: {
                        // Following descriptions taken from http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
                        addUnnecessaryBendpoints: false, // Adds bend points even if an edge does not change direction.
                        aspectRatio: 1.6, // The aimed aspect ratio of the drawing, that is the quotient of width by height
                        borderSpacing: 20, // Minimal amount of space to be left to the border
                        compactComponents: false, // Tries to further compact components (disconnected sub-graphs).
                        crossingMinimization: 'LAYER_SWEEP', // Strategy for crossing minimization.
                        /* LAYER_SWEEP The layer sweep algorithm iterates multiple times over the layers, trying to find node orderings that minimize the number of crossings. The algorithm uses randomization to increase the odds of finding a good result. To improve its results, consider increasing the Thoroughness option, which influences the number of iterations done. The Randomization seed also influences results.
                        INTERACTIVE Orders the nodes of each layer by comparing their positions before the layout algorithm was started. The idea is that the relative order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive layer sweep algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
                        cycleBreaking: 'GREEDY', // Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite direction of regular edges (that is, reversed edges will point left if edges usually point right).
                        /* GREEDY This algorithm reverses edges greedily. The algorithm tries to avoid edges that have the Priority property set.
                        INTERACTIVE The interactive algorithm tries to reverse edges that already pointed leftwards in the input graph. This requires node and port coordinates to have been set to sensible values.*/
                        direction: 'DOWN', // Overall direction of edges: horizontal (right / left) or vertical (down / up)
                        /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
                        edgeRouting: 'ORTHOGONAL', // Defines how edges are routed (POLYLINE, ORTHOGONAL, SPLINES)
                        edgeSpacingFactor: 0.5, // Factor by which the object spacing is multiplied to arrive at the minimal spacing between edges.
                        feedbackEdges: false, // Whether feedback edges should be highlighted by routing around the nodes.
                        fixedAlignment: 'NONE', // Tells the BK node placer to use a certain alignment instead of taking the optimal result.  This option should usually be left alone.
                        /* NONE Chooses the smallest layout from the four possible candidates.
                        LEFTUP Chooses the left-up candidate from the four possible candidates.
                        RIGHTUP Chooses the right-up candidate from the four possible candidates.
                        LEFTDOWN Chooses the left-down candidate from the four possible candidates.
                        RIGHTDOWN Chooses the right-down candidate from the four possible candidates.
                        BALANCED Creates a balanced layout from the four possible candidates. */
                        inLayerSpacingFactor: 1.0, // Factor by which the usual spacing is multiplied to determine the in-layer spacing between objects.
                        layoutHierarchy: false, // Whether the selected layouter should consider the full hierarchy
                        linearSegmentsDeflectionDampening: 0.3, // Dampens the movement of nodes to keep the diagram from getting too large.
                        mergeEdges: false, // Edges that have no ports are merged so they touch the connected nodes at the same points.
                        mergeHierarchyCrossingEdges: true, // If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as possible.
                        nodeLayering:'NETWORK_SIMPLEX', // Strategy for node layering.
                        /* NETWORK_SIMPLEX This algorithm tries to minimize the length of edges. This is the most computationally intensive algorithm. The number of iterations after which it aborts if it hasn't found a result yet can be set with the Maximal Iterations option.
                        LONGEST_PATH A very simple algorithm that distributes nodes along their longest path to a sink node.
                        INTERACTIVE Distributes the nodes into layers by comparing their positions before the layout algorithm was started. The idea is that the relative horizontal order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive node layering algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
                        nodePlacement:'BRANDES_KOEPF', // Strategy for Node Placement
                        /* BRANDES_KOEPF Minimizes the number of edge bends at the expense of diagram size: diagrams drawn with this algorithm are usually higher than diagrams drawn with other algorithms.
                        LINEAR_SEGMENTS Computes a balanced placement.
                        INTERACTIVE Tries to keep the preset y coordinates of nodes from the original layout. For dummy nodes, a guess is made to infer their coordinates. Requires the other interactive phase implementations to have run as well.
                        SIMPLE Minimizes the area at the expense of... well, pretty much everything else. */
                        randomizationSeed: 1, // Seed used for pseudo-random number generators to control the layout algorithm; 0 means a new seed is generated
                        routeSelfLoopInside: false, // Whether a self-loop is routed around or inside its node.
                        separateConnectedComponents: true, // Whether each connected component should be processed separately
                        spacing: 20, // Overall setting for the minimal amount of space to be left between objects
                        thoroughness: 7 // How much effort should be spent to produce a nice layout..
                    },
                    priority: function(  ){ return null; }, // Edges with a non-nil value are skipped when greedy edge cycle breaking is enabled
                },
                layoutBreadthFirst: {
                    name: 'breadthfirst',
                    fit: false, // whether to fit the viewport to the graph
                    directed: true, // whether the tree is directed downwards (or edges can point in any direction if false)
                    padding: this.gridSize / 2, // padding on fit
                    circle: false, // put depths in concentric circles if true, put depths top down if false
                    grid: false, // whether to create an even grid into which the DAG is placed (circle:false only)
                    //spacingFactor: 1, // positive spacing factor, larger => more space between nodes (N.B. n/a if causes overlap)
                    boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                    avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
                    nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
                    roots: undefined, // the roots of the trees
                    maximal: true, // whether to shift nodes down their natural BFS depths in order to avoid upwards edges (DAGS only)
                    animate: false, // whether to transition the node positions
                    animationDuration: 500, // duration of animation in ms if enabled
                    animationEasing: undefined, // easing of animation if enabled,
                    animateFilter: function (  ){ return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
                    ready: undefined, // callback on layoutready
                    stop: undefined, // callback on layoutstop
                    transform: function (node, position ){ return position; } // transform a given node position. Useful for changing flow direction in discrete layouts
                },
                minZoom: 0.05,
                maxZoom: 2.0,
                style: [
                    // see https://github.com/cytoscape/cytoscape.js/blob/master/documentation/md/style.md
                    // for style settings. Note can layer and position SVG background images - to maybe use
                    // images for finds and samples indicators  
                    {
                        selector: 'node',
                        style: {
                            'min-zoomed-font-size': 1,
                            'font-family': 'sans-serif',
                            'font-size': '1em',
                            'shape': 'rectangle',
                            'width': this.gridSize * 3,
                            'height': this.gridSize * 1,
                            'padding': 0,
                            'text-opacity': 1.0,
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'color': 'black',
                            'background-color': 'white',
                            'background-opacity': 1.0,
                            'border-color': 'black',
                            'border-width': '4px',
                            'border-style': 'solid',
                            'border-opacity': 1.0,
                            //'background-fill': 'radial-gradient',
                            //'background-gradient-stop-colors': 'aliceblue blue'
                        }
                    },                    
                    {                       
                        selector: 'node[class="context"]',
                        style: {
                            'width': this.gridSize * 3,
                            'height': this.gridSize * 1,
                            'label':  el => `${el.data('label') ? el.data('label') : el.data('id')}`,
                            //'background-fill': 'radial-gradient',
                            //'background-gradient-stop-colors': 'white gray'  
                        }
                    },
                    {                       
                        selector: 'node[class="context"]:selected',
                        style: { 'background-color': 'gold' }
                    },
                    /*{  
                        // different shape based on type                     
                        selector: 'node[type="Layer"]',
                        style: { 'shape': 'rhomboid' }
                    },*/

                    {
                        selector: 'node[class="phase"]',
                        style: {
                            //'label':  el => `${el.data('label') ? el.data('label') : el.data('id')}`,
                            'width': '600px',
                            'text-opacity': 0.75,
                            'text-valign': 'top',
                            'text-halign': 'right',
                            'text-margin-x': 5,
                            'text-margin-y': 15,
                            'padding': this.gridSize,
                            'color': 'gray',                            
                            //'background-color': 'ivory',
                            'border-color': 'lightgray',
                            'border-width': '1px'                            
                        }
                    }, 
                    {                       
                        selector: 'node[class="phase"]:selected',
                        style: { 'background-color': 'gold' }
                    },                                     
                    {
                        selector: 'node[class="group"]',
                        style: {
                            //'padding': 15, 
                            'label':  el => `${el.data('label') ? el.data('label') : el.data('id')}`, 
                            'text-opacity': 0.75,
                            'text-valign': 'top',
                            'text-halign': 'right',
                            'text-margin-x': 5,
                            'text-margin-y': 15,
                            'color': 'green',                            
                            'background-color': 'honeydew',
                            'border-color': 'green'                            
                        }
                    }, 
                    {                       
                        selector: 'node[class="group"]:selected',
                        style: { 'background-color': 'gold' }
                    },                  
                    {
                        selector: 'node[class="subgroup"]',
                        style: {
                            'label':  el => `${el.data('label') ? el.data('label') : el.data('id')}`, 
                            'text-opacity': 0.75,
                            'text-valign': 'center',
                            'text-halign': 'right',
                            'text-margin-x': 5,
                            //'text-margin-y': 0,
                            'text-justification': 'auto',
                            
                            'color': 'blue',                            
                            'background-color': 'aliceblue',
                            'border-color': 'blue',                           
                        }
                    },	 
                    {                       
                        selector: 'node[class="subgroup"]:selected',
                        style: { 'background-color': 'gold' }
                    },                    	
                    {
                        selector: 'edge',
                        style: {
                            'curve-style': 'taxi',
                            'taxi-direction': 'downward',
                            'taxi-turn': 15,
                            'edge-distances': 'intersection',
                            'taxi-turn-min-distance': 15,
                            'source-endpoint': 'outside-to-node',
                            'target-endpoint': 'outside-to-node',
                            'width': 3,
                            'target-arrow-shape': 'none',
                            'line-color': 'gray',
                            'line-style': 'solid',
                            'target-arrow-color': '#9dbaea'
                        }
                    },
                    {
                        selector: 'edge[class="derived"]',
                        style: {
                            'curve-style': 'straight',
                            'taxi-direction': 'downward',
                            //'taxi-turn': 15,
                            //'edge-distances': 'intersection',
                            //'taxi-turn-min-distance': 15,
                            'source-endpoint': 'outside-to-line',
                            'target-endpoint': 'outside-to-line',
                            'width': 4,
                            'target-arrow-shape': 'triangle',                            
                            'arrow-scale': 5,
                            'line-color': 'red',
                            'line-style': 'solid',
                            //'target-arrow-color': '#9dbaea'
                        }
                    },
                    {                       
                        selector: 'edge:selected',
                        style: { 'line-color': 'gold' }
                    },
                ]                
            }
		}
	},
    watch: {
        // show visual indicator of currently selected node if selected elsewhere
        selectedID(newValue) {
            const cyi = (this.$refs.cy || {}).instance || null
            if(!cyi) return 
            cyi.elements(":selected").unselect()
            cyi.$id(newValue).select()
        }
    },
	computed: { 
        gridSpacing(){ return this.gridSize }, 
        nodes() {
            return []
                .concat(this.$store.getters.phases)
                .concat(this.$store.getters.groups)
                .concat(this.$store.getters.subgroups)
                .concat(this.$store.getters.contexts)
                //.concat(this.$store.getters.datings)    // don't display on graph               
        },
        edges() {
            return (this.$store.getters.edges).filter(e => e.data.type == "above")
            //return (this.$store.getters.derivedEdges)
        }, 
        selectedID() {
            return this.$store.getters.selectedID            
        },                   
    },
    /*watch: {
        elements: async function () {
            const cyi = (this.$refs.cy || {}).instance
            this.redoLayout(cyi)            
        }
    },*/
	methods: {
        preConfig(cytoscape) {
            cytoscape.use(dagre) 
            cytoscape.use(elk)
            cytoscape.use(klay)
            cytoscape.use(gridGuide) 
            cytoscape.use(cyCanvas) 
            cytoscape.use(panzoom)     
            cytoscape.use($)               
        },

        // notify store that a node has been selected in the diagram
        elementSelected(event, element){
            const cyi = (this.$refs.cy || {}).instance || null
            if(!cyi) return 
            cyi.elements(":selected").unselect()           
            cyi.$id(element.data.id).select()     
            this.$store.dispatch('setSelectedID', element.data.id)
        },
        
        afterCreated(cytoscape) {
            
            cytoscape.panzoom(this.config.panzoom)
        
            // set up grid, snap and guidelines
            cytoscape.gridGuide({
                // On/Off Modules
                /* From the following four snap options, at most one should be true at a given time */
                snapToGridOnRelease: false, // Snap to grid on release
                snapToGridDuringDrag: true, // Snap to grid during drag
                snapToAlignmentLocationOnRelease: false, // Snap to alignment location on release
                snapToAlignmentLocationDuringDrag: false, // Snap to alignment location during drag
                distributionGuidelines: true, // Distribution guidelines
                geometricGuideline: true, // Geometric guidelines
                initPosAlignment: false, // Guideline to initial mouse position
                centerToEdgeAlignment: false, // Center to edge alignment
                resize: false, // Adjust node sizes to cell sizes
                parentPadding: false, // Adjust parent sizes to cell sizes by padding
                drawGrid: true, // Draw grid background
            
                // General
                gridSpacing: this.gridSize, // Distance between the lines of the grid.
                snapToGridCenter: true, // Snaps nodes to center of gridlines. When false, snaps to gridlines themselves. Note that either snapToGridOnRelease or snapToGridDuringDrag must be true.
            
                // Draw Grid
                zoomDash: true, // Determines whether the size of the dashes should change when the drawing is zoomed in and out if grid is drawn.
                panGrid: true, // Determines whether the grid should move then the user moves the graph if grid is drawn.
                gridStackOrder: 0, // Namely z-index
                gridColor: '#dedede', // Color of grid lines
                lineWidth: 1.0, // Width of grid lines
            
                // Guidelines
                guidelinesStackOrder: 4, // z-index of guidelines
                guidelinesTolerance: 2.00, // Tolerance distance for rendered positions of nodes' interaction.
                guidelinesStyle: { // Set ctx properties of line. Properties are here:
                    strokeStyle: "#8b7d6b", // color of geometric guidelines
                    geometricGuidelineRange: 400, // range of geometric guidelines
                    range: 100, // max range of distribution guidelines
                    minDistRange: 10, // min range for distribution guidelines
                    distGuidelineOffset: 10, // shift amount of distribution guidelines
                    horizontalDistColor: "#ff0000", // color of horizontal distribution alignment
                    verticalDistColor: "#00ff00", // color of vertical distribution alignment
                    initPosAlignmentColor: "#0000ff", // color of alignment to initial mouse location
                    lineDash: [0, 0], // line style of geometric guidelines
                    horizontalDistLine: [0, 0], // line style of horizontal distribution guidelines
                    verticalDistLine: [0, 0], // line style of vertical distribution guidelines
                    initPosAlignmentLine: [0, 0], // line style of alignment to initial mouse position
                },
            
                // Parent Padding
                parentSpacing: -1 // -1 to set paddings of parents to gridSpacing
            })
            
            //this.drawPhases(cytoscape)
        },

        // draw phases separately
       // drawPhases(cyi) {
            //const cyi = (this.$refs.cy || {}).instance || null      
            //if(!cyi) return
            /*const layers = cyi.layers()
            layers.nodeLayer.insertAfter('html-static').node.innerHTML = 'Static Test Label'
            layers.renderPerNode(layers.append('canvas'), (ctx, node, bb) => {
                if(node._private.data.class == 'phase') {
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(0, 0, 600, bb.h);
                }
            });  */

        //},
        
        // export visible part of diagram to PNG file
        exportPartPNG(cyi) { this.exportPNG(cyi, false) },

        // export entire diagram to PNG file
        exportFullPNG(cyi) { this.exportPNG(cyi, true) },

        // export diagram to PNG file
        exportPNG(cyi, full=false) {
            if(!cyi) return
            const png64 = cyi.png({full: full, output: 'blob'});            
            const fileName = `phaser-${ moment().format("YYYYMMDDHHmmss") }.png`
            
            let blob = new Blob([png64], { type: 'image/png' })
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, fileName)
            } else {
                let link = document.createElement('a')
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    let url = URL.createObjectURL(blob)
                    link.setAttribute('href', url)
                    link.setAttribute('download', fileName)
                    link.style.visibility = 'hidden'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                }
            }
        },

        clear(cyi) {
            cyi.zoom(1)
            cyi.pan({x: 0, y: 0})
        },

        // zoom diagram to various scales
        zoomFit(cyi) { if(cyi) cyi.fit() },
        zoomIn(cyi) { this.zoomMe(cyi, 1.25) },
        zoomOut(cyi) { this.zoomMe(cyi, 0.75) },
        zoomMe(cyi, zoomBy=1) {
            if(!cyi) return
            cyi.zoom({
                level: cyi.zoom() * zoomBy,
                position: {
                    x: Math.round((cyi.extent().x1 + cyi.extent().x2) / 2),
                    y: Math.round((cyi.extent().y1 + cyi.extent().y2) / 2),
                }
            })
        },        

        redoLayout(cyi, name="dagre") {
            if(!cyi || this.locked) return      
            this.busy = true     
            this.clear(cyi)
            let options = this.config.layoutDagre //default
            switch(name) {
                case "elk": options = this.config.layoutElk;break;
                case "dagre": options = this.config.layoutDagre;break;  
                case "klay": options = this.config.layoutKlay;break;    
                case "breadthfirst": options = this.config.layoutBreadthFirst;break;        
            }
            cyi.layout(options).run() 
            //this.drawPhases(cyi)
            this.busy = false
        },  

        layoutStop() {
            // update node x,y positions within store following auto-layout
            const cyi = (this.$refs.cy || {}).instance || null
            if(!cyi) return
            
            cyi.elements("node").forEach(node => { 
                this.$store.dispatch('updateNode', { 
                    data: node.data(), 
                    position: node.position() 
                })
            })
            this.busy = false
        },

        lockChanged(value) {
            this.locked = value
            const cyi = (this.$refs.cy || {}).instance || null
            if(cyi) cyi.autolock(value)           
        },

        drawPhases(cyi) {
            if(!cyi) return
            // drawing phases on supplementary layer
            var layer = cyi.cyCanvas()
            var canvas = layer.getCanvas()
            var ctx = canvas.getContext('2d')

            cyi.on("render cyCanvas.resize pan", function() {
                
                layer.resetTransform(ctx)
                layer.clear(ctx)
                layer.setTransform(ctx)

                // Draw fixed elements
                //ctx.fillRect(0, 0, 100, 100); // Top left corner
                
                // Draw phase elements relative to cy nodes
                let extent = cyi.extent()            
                cyi.nodes('[class = "phase"]')
                    .forEach(function(n) {
                        let dims = n.layoutDimensions()
                        let x = extent.x1
                        let y = n.position().y - (dims.h/2)
                        let w = extent.w
                        let h = dims.h
                    
                        // draw phase outline (dashed red)
                        ctx.strokeStyle = "red"
                        ctx.setLineDash([5,5])
                        ctx.strokeRect(x, y, w, h) 
                        
                        // draw phase fill
                        ctx.globalAlpha = 0.2
                        ctx.fillStyle = "ivory"
                        ctx.fillRect(x,y, w,h)
                        ctx.globalAlpha = 1.0
                });
            });
        },

        // draw phase lines midway between each phase instead??
        drawPhases2(cyi) {
            if(!cyi) return
            // drawing phases on supplementary layer
            var layer = cyi.cyCanvas()
            var canvas = layer.getCanvas()
            var ctx = canvas.getContext('2d')

            cyi.on("render cyCanvas.resize pan", function() {
                // prepare layer for drawing
                layer.resetTransform(ctx)
                layer.clear(ctx)
                layer.setTransform(ctx)
                
                let prevNode = null
                let extent = cyi.extent()  

                // Draw phase elements relative to cy nodes                    
                cyi.nodes('[class = "phase"]')
                    .sort((a,b) => a.data().dating?.maxYear - b.data().dating?.maxYear)
                    .forEach(function(thisNode) {
                        let dims = thisNode.layoutDimensions()
                        let x = extent.x1
                        let y = thisNode.position().y - (dims.h/2)                         

                        // line style for drawing (dashed red)
                        ctx.strokeStyle = "red"
                        ctx.strokeWidth = "2"
                        ctx.setLineDash([4,4])

                        // draw phase line directly above this node                       
                        ctx.beginPath()
                        ctx.moveTo(x, y)
                        ctx.lineTo(extent.w, y)
                        ctx.stroke()                           
                       
                        if(!prevNode) {
                            // first/lowest - draw extra phase line below this node
                            let y = thisNode.position().y + (dims.h/2)
                            ctx.beginPath()
                            ctx.moveTo(x, y)
                            ctx.lineTo(extent.w, y)
                            ctx.stroke()                            
                        }  

                        // draw phase fill
                        //ctx.globalAlpha = 0.1
                        //ctx.fillStyle = "ivory"
                        //ctx.fillRect(x,y, w,h)
                        //ctx.globalAlpha = 1.0
                    
                        // draw phase line (dashed red)
                        /*ctx.strokeStyle = "red"
                        ctx.setLineDash([5,5])
                        ctx.beginPath()
                        ctx.moveTo(x1, y)
                        ctx.lineTo(x2, y)
                        ctx.stroke()    */
                        
                        // draw phase label
                        ctx.font = "20px Arial"
                        ctx.textAlign = "left"
                        ctx.textBaseline = "top"
                        ctx.fillStyle = "red"
                        ctx.fillText(thisNode.data().label, extent.x1 + 10, y + 10)
                        ctx.fillText(thisNode.data().label, extent.x2 - 15, y + 10)
                        // store prev for next iteration
                        prevNode = thisNode
                    })
            })
        }
    },

	// lifecycle hooks
    beforeCreate() {},
    created() {},   
    afterCreated() {
        // if(this.cyi) this.cyi.layout.run()
    }, 
	beforeMount() {},
	mounted() {
        let self = this  
        const cyi = (this.$refs.cy || {}).instance || null      
        if(!cyi) return

        // diagram locked by default
        cyi.autolock(this.locked)

        cyi.panzoom(this.config.panzoom)
        
        // cytoscape diagram event handlers
        cyi.on('click tap', 'node', function(evt) {
            self.selectedElementID = evt.target.id() 
        })
        // 'position' event causes endless loop here, so using vmouseup/tapend
        // notify store of new node position after being dragged on screen
        cyi.on('vmouseup tapend', 'node', function(evt) {
            let payload = {
               data: evt.target.data(),
               position: evt.target.position()
            }
            self.$store.dispatch('updateNode', payload)
        })
        
        // drawing phases on supplementary layer
       // self.drawPhases(cyi)
        self.drawPhases2(cyi)
        // override height setting on cytoscape-vue div, else always 600px!
        // see https://github.com/rcarcasses/vue-cytoscape/issues/47
        document.getElementById("cytoscape-div").style.minHeight="900px" 
                
        // event bus message handlers (for events fired from menu bar)
        self.$root.$on("diagramClear", () => self.clear(cyi))
        self.$root.$on("diagramZoomIn", () => self.zoomIn(cyi))
        self.$root.$on("diagramZoomOut", () => self.zoomOut(cyi))
        self.$root.$on("diagramZoomFit", () => self.zoomFit(cyi))
        self.$root.$on("diagramExportPartPNG", () => self.exportPartPNG(cyi))
        self.$root.$on("diagramExportFullPNG", () => self.exportFullPNG(cyi))
        self.$root.$on("diagramRedoLayout", name => self.redoLayout(cyi, name))      
        // this one fired from ItemEditor - just re-layout contents of this node
        self.$root.$on("redoCompoundNodeLayout", node => {
            let cyNode = cyi.$(`#${node.data.id}`)
            // get TL position of compound node prior to redoing layout
            let bbox1 = cyNode.boundingBox()
            let tlPos = { x: bbox1.x1, y: bbox1.y1 }
            
            // only redoing layout for descendant
            // nodes and their associated edges
            let nodes = cyNode.descendants()
            let edges = nodes.edgesWith(nodes)
            nodes.merge(edges).layout(this.config.layoutDagre).run() 

            // compound node may have moved - restore to previous position   
            let bbox2 = cyNode.boundingBox() 
            let newPos = {
                x: (tlPos.x + (bbox2.w / 2)) - 5, // not sure why -5 but it works??
                y: (tlPos.y + (bbox2.h / 2))
            }        
            cyNode.position(newPos)
            // inform the store about the new position
            self.$store.dispatch('updateNode', { data: node.data, position: newPos })
        }), 

        // ensure parent change in data is reflected on diagram, 
        // cytoscape data.parent is immutable so must call 'move'
        self.$root.$on("nodeParentChanged", (node) => {
            let cyNode = cyi.$(`#${node.data.id}`)
            if(cyNode && node.data.parent !== "")
                cyNode.move({ parent: node.data.parent }) 
            else    // removing from group
                cyNode.move({ parent: null })
        })
    },
	beforeUpdate() {},
	updated() {},
	beforeDestroy() {},
	destroyed() {
        // clear event listeners to avoid memory leaks. See:
        // https://blog.usejournal.com/vue-js-best-practices-c5da8d7af48d
        //self.$root.$off()
    }
}
</script>

<style scoped>
  /* #diagram2 { position: absolute; } */
</style>