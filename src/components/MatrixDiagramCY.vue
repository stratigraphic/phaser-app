<template>
<b-overlay :show="busy" rounded="sm">	
	<!--cytoscape graph-->
    <div id="holder" class="overflow-auto position-relative"> 
        <!--<div class="position-relative">  -->           
        <Lock id="lock" class="position-absolute m-2" v-model="locked" @input="lockChanged"/>
        <Legend id="legend" class="position-absolute m-2"/>
        
        <b-button
        size="sm" 
            id="refresh"
            class="position-absolute m-2 shadow"          
			@click.stop="refreshDiagram()"
            title="Refresh diagram"
            alt="Refresh diagram"
			:disabled="busy"
            variant="primary">
            <b-icon-arrow-clockwise />            
        </b-button> 
        
        <!--</div> -->
        <!--<div id="navigator"></div> -->
              
        <cytoscape id="diagram" 
            ref="cy" 
            :config="config" 
            :preConfig="preConfig" 
            :afterCreated="afterCreated">                  
            
            <cy-element v-for="node in nodes" 
                :key="node.data.id"
                :class="node.data.class"
                :definition="node"
                @click="elementSelected($event, node)"
                :sync="false"/>
            
            <cy-element v-for="edge in edges"
                :key="edge.data.id"
                :class="edge.data.class"                
                :definition="edge"
                @click="elementSelected($event, edge)"
                :sync="false"/>            
        </cytoscape>
                  
    </div>   
</b-overlay>	
</template>

<script>
import { ref, unref, shallowRef, computed, watch, onMounted, onBeforeUnmount, inject } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import dagre from 'cytoscape-dagre'
//import elk from 'cytoscape-elk'
//import klay from 'cytoscape-klay'
//import noOverlap from 'cytoscape-no-overlap' // not working?
//import navigator from 'cytoscape-navigator'
import gridGuide from 'cytoscape-grid-guide'
import cyCanvas from 'cytoscape-canvas'
import panzoom from 'cytoscape-panzoom'
//import domnode from 'cytoscape-dom-node'
//import nodehtmllabel from 'cytoscape-node-html-label'
import $ from 'jquery'
//import _merge from "lodash/merge"

//import popper from "cytoscape-popper"
//import tippy from 'tippy.js'
//import { tippy } from "vue-tippy"
//import { useTippy } from "vue-tippy/composition";
//import {delegate} from 'tippy.js'
//import "tippy.js/themes/light.css"
//import { useTippy } from "vue-tippy/composition"
import Legend from '@/components/Legend'
import Lock from '@/components/Lock'
import EventBus from '@/composables/EventBus'
import { NodeClass, EdgeType, ElementColour, timestamp } from '@/composables/PhaserCommon'

        
export default {
    components: { Legend, Lock },	

	props: { 
        gridSize: {
            type: Number,
            required: false,
            default: 40
        }
    },

    setup(props) {  
        const store = inject('store')      
		const cy = shallowRef(null)
        const busy = ref(false)
         //let popperInstance = null

        const locked = computed({
            get () { return store.getters.diagramLock },
            set (newValue) {
                const cyi = cy.value.instance
                if(cyi) cyi.autolock(newValue)
                store.dispatch('setDiagramLock', newValue) 
            }            
        })        

        const lockChanged = (newValue) => {
            locked.value = newValue
            //const cyi = cy.value.instance
            //if(!cyi) return
            //store.dispatch('setDiagramLock', newValue)
            //locked.value = newValue
           // cyi.autolock(newValue)           
        }
        
        const config = {
            pixelRation: 1,
            selectionType: 'single',
            minZoom: 0.05,
            maxZoom: 2.0, 
            // the following 2 settings can improve performance on large graphs:  
            //hideEdgesOnViewport: true, // edges not drawn during pan and zoom
            //textureOnViewport: true,           
            panzoom: {
                zoomFactor: 0.05, // zoom factor per zoom tick
                zoomDelay: 45, // how many ms between zoom ticks
                minZoom: 0.05, // min zoom level
                maxZoom: 2.0, // max zoom level
                fitPadding: 50, // padding when fitting
                panSpeed: 20, // how many ms in between pan ticks
                panDistance: 20, // max pan distance per tick
                panDragAreaSize: 75, // the length of the pan drag box in which the vector for panning is calculated (bigger = finer control of pan speed and direction)
                panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
                panInactiveArea: 8, // radius of inactive area in pan drag box
                panIndicatorMinOpacity: 0.5, // min opacity of pan indicator (the draggable nib); scales from this to 1.0
                zoomOnly: false, // a minimal version of the ui only with zooming (useful on systems with bad mousewheel resolution)
                fitSelector: undefined, // selector of elements to fit
                //animateOnFit: function(){ return false; },// whether to animate on fit                   
                //fitAnimationDuration: 1000, // duration of animation on fit
                // icon class names
                sliderHandleIcon: 'fa fa-minus', //'"><b-icon-arrow-up/></span><span class="',
                zoomInIcon: 'fa fa-plus',
                zoomOutIcon: 'fa fa-minus',
                resetIcon: 'fa fa-expand'
            }, 
            navigator: {
                container: "#navigator", // html dom element
                viewLiveFramerate: 1, // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
                thumbnailEventFramerate: 1, // max thumbnail's updates per second triggered by graph updates
                thumbnailLiveFramerate: 1, // max thumbnail's updates per second. Set false to disable
                dblClickDelay: 200, // milliseconds
                removeCustomContainer: false, // destroy the container specified by user on plugin destroy
                rerenderDelay: 100 // ms to throttle rerender updates to the panzoom for performance
            },   
            gridguide: {
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
                gridSpacing: props.gridSize, // Distance between the lines of the grid.
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
             
            },                          
            layoutDagre: {
                name: 'dagre', 
                // dagre options, uses default value if undefined
                nodeSep: props.gridSize - 4, // the separation between adjacent nodes in the same rank
                //edgeSep: 20, // the separation between adjacent edges in the same rank                    
                rankSep: props.gridSize - 4, // the separation between each rank in the layout
                marginx: props.gridSize / 2,
                marginy: props.gridSize / 2,                    
                rankDir: 'TB', // 'TB' for top to bottom flow, 'LR' for left to right
                ranker: 'network-simplex', // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
                minLen: function( edge ){ return edge ? 1 : 1 }, // number of ranks to keep between the source and target of the edge
                //edgeWeight: function( edge ){ return 1; }, // higher weight edges are generally made shorter and straighter than lower weight edges

                // general layout options
                fit: false, // whether to fit to viewport
                padding: props.gridSize / 2, // fit padding
                spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
                nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
                animate: false, // whether to transition the node positions
                boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                //transform: function( node, pos ){ return pos; }, // a function that applies a transform to the final node position
                //zoom: function(e){ console.log("zoom"); console.log(e)},
                //viewport: function(e){ console.log("viewport"); console.log(e)},
                //ready: layoutDone, //function(){}, // on layoutready
                //stop: layoutDone // on layoutstop              
            },
            layoutElk: {
                name: "elk",
                nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
                fit: false, // Whether to fit
                padding: props.gridSize / 2, // Padding on fit
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
                    algorithm: "layered", // box disco force layered mrtree random stress
                    alignment: "LEFT", //AUTOMATIC,LEFT,RIGHT,TOP,BOTTOM,CENTER
                    layered: {
                        unnecessaryBendpoints: true
                    },
                    //padding: 200,
                    mrtree: {
                        searchOrder: "DFS",
                        weighting: "DESCENDANTS" // or FAN
                    }
                },   
                        
            },
            layoutKlay: {
                name: "klay",                    
                nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
                fit: false, // Whether to fit
                padding: props.gridSize / 2, // Padding on fit
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
                priority: function( ){ return null; }, // Edges with a non-nil value are skipped when greedy edge cycle breaking is enabled
            },
            layoutBreadthFirst: {
                name: 'breadthfirst',
                fit: false, // whether to fit the viewport to the graph
                directed: true, // whether the tree is directed downwards (or edges can point in any direction if false)
                padding: props.gridSize / 2, // padding on fit
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
            style: [
                // see https://github.com/cytoscape/cytoscape.js/blob/master/documentation/md/style.md
                // for style settings. Note can layer and position SVG background images - to maybe use
                // images for dating indicators  
                {
                    selector: 'node',
                    style: {
                        'min-zoomed-font-size': '1em',
                        'font-family': 'Arial',
                        'font-size': '2em',
                        'shape': 'rectangle',
                        'width': props.gridSize * 3,
                        'height': props.gridSize * 1,
                        'padding': 0,
                        'text-opacity': 1.0,
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'color': ElementColour.NODE_FG,
                        'background-color': ElementColour.NODE_BG,
                        'background-opacity': 1.0,
                        'border-color': ElementColour.NODE_FG,
                        'border-width': '4px',
                        'border-style': 'solid',
                        'border-opacity': 1.0, 
                         //'background-fill': 'radial-gradient',
                        //'background-gradient-stop-colors': 'aliceblue blue'
                    }
                },                    
                {                       
                    selector: `node[class="${NodeClass.CONTEXT}"]`,
                    style: {
                        'shape': 'round-rectangle',
                        //'width': props.gridSize * 3,
                        //'height': props.gridSize * 1,
                        //'font-weight': 'bold',
                        'label':  el => `${el.data('label') ? el.data('label') : el.data('id')}`,
                        'color': el => store.getters.contextHasDating(el.data('id')) ? ElementColour.CONTEXT_BG : ElementColour.CONTEXT_FG,
                        'background-color': el => store.getters.contextHasDating(el.data('id')) ? ElementColour.CONTEXT_FG : ElementColour.CONTEXT_BG
                        //'background-fill': 'radial-gradient',
                        //'background-gradient-stop-colors': 'white gray'  
                    }
                },
                {                       
                    selector: `node[class="${NodeClass.CONTEXT}"]:selected`,
                    style: { 
                        'background-color': ElementColour.SELECTED_BG, 
                        'color': ElementColour.CONTEXT_FG // 'black'
                    }
                },
                /*{  
                     // different shape based on type?                     
                    selector: 'node[type="Layer"]',
                    style: { 'shape': 'rhomboid' }
                },*/
                {
                    selector: `node[class="${NodeClass.PHASE}"]`,
                    style: {
                        'width': '600px',
                        'text-opacity': 0.75,
                        'text-valign': 'top',
                        'text-halign': 'right',
                        'text-margin-x': 5,
                        'text-margin-y': 15,
                        'padding': props.gridSize,
                        'color': 'gray',  
                        'background-opacity': 0,                          
                        'background-color': 'transparent',
                        'border-color': 'lightgray',
                        'border-width': '0px'                                                     
                     }
                }, 
                {                       
                    selector: `node[class="${NodeClass.PHASE}"]:selected`,
                    style: { 
                        'background-color': ElementColour.SELECTED_BG,
                        'background-opacity': 1 
                     }
                },                                                   
                {
                    selector: `node[class="${NodeClass.GROUP}"]`,
                    style: {
                        'label':  el => `${el.data('label') ? el.data('label') : el.data('id')}`, 
                        'text-opacity': 0.75,
                        'text-valign': 'top',
                        'text-halign': 'right',
                        'text-margin-x': 5,
                        'text-margin-y': 15,
                        'color': ElementColour.GROUP_FG,                            
                        'background-color': ElementColour.GROUP_BG,
                        'border-color': ElementColour.GROUP_FG,    
                        'compound-sizing-wrt-labels': 'include'                        
                    }
                }, 
                {                       
                    selector: `node[class="${NodeClass.GROUP}"]:selected`,
                    style: { 'background-color': ElementColour.SELECTED_BG }
                },                  
                {
                    selector: `node[class="${NodeClass.SUBGROUP}"]`,
                    style: {
                        'label':  el => `${el.data('label') ? el.data('label') : el.data('id')}`, 
                        'text-opacity': 0.75,
                        'text-valign': 'center',
                        'text-halign': 'right',
                        'text-margin-x': 5,
                        //'text-margin-y': 0,
                        'text-justification': 'auto',
                        'color': ElementColour.SUBGROUP_FG,                            
                        'background-color': ElementColour.SUBGROUP_BG,
                        'border-color': ElementColour.SUBGROUP_FG,                           
                    }
                },	 
                {                       
                    selector: `node[class="${NodeClass.SUBGROUP}"]:selected`,
                    style: { 'background-color': 'gold' }
                },                    	
                {
                    selector: 'edge',
                    style: {
                        'curve-style': 'taxi',
                        'taxi-direction': 'downward',
                        'taxi-turn': props.gridSize / 2, //15,
                        'edge-distances': 'intersection',
                        'taxi-turn-min-distance': props.gridSize / 2,
                        'source-endpoint': 'outside-to-node',
                        'target-endpoint': 'outside-to-node',
                        'width': 3,
                        //'target-arrow-shape': 'none',
                        //'target-arrow-color': 'gray',
                        'line-color': ElementColour.EDGE,
                        'line-style': 'solid',                        
                    }
                },
                {
                    selector: 'edge.connected', // syntax for css class
                    style: { 'line-color': ElementColour.EDGE_CONNECTED, 'width': 8 }
                },
                {                       
                    selector: 'edge:selected',
                    style: { 'line-color': ElementColour.EDGE_SELECTED, 'width': 8, }
                }                
            ]                
        }
       
        const selectedID = computed(() => store.getters.selectedID)

        /*function makePopper(ele) {
            //let ref = ele.popperRef();

            ele.tippy = tippy(document.createElement('div'), {
                //getReferenceClientRect: ref.getBoundingClientRect(),
                content: ele.id(),
                onHidden(instance) {
                instance.destroy();
                },
            });
            ele.tippy.show();

            ele.on('mouseout', () => {
                ele.tippy.hide();
            });
        }*/

        watch(selectedID, (newValue, oldValue) => {	
            const cyi = cy.value.instance 
            if(!cyi) return   

            // unselect prev selected and remove any highlighting of connected edges
            let cyNode = cyi.$id(oldValue)
            if(cyNode) {
                cyNode.unselect()
                cyNode.connectedEdges().removeClass("connected")                 
            }            
                        
            /*
            // allow pass-through panning on phases. shouldn't be here, but not sure where it should go..    
            // not working anyway... cannot pan regardless
            cyi.nodes('[class="phase"]')
                .unselectify()
                .ungrabify()
                .panify()
            */
            
            // show node as selected and highlight any connected edges 
            cyNode = cyi.$id(newValue)
            if(cyNode) {
                cyNode.select() // show node as selected
                cyNode.connectedEdges().addClass("connected") // highlight any connected edges     

                /*popperInstance?.destroy()
                popperInstance = cyNode.popper({
                    content: () => {
                        let div = document.createElement('div')
                        div.innerHTML = 'Popper content'
                        document.body.appendChild(div)
                        return div
                    },
                    popper: {
                        placement: "right"
                    } // my popper options here
                })*/ 

                


            }
        })
    
        //const gridSpacing = computed(() => props.gridSize) 

        /*const nodes = computed(() => {
            return []
                .concat(store.getters.phases)
                .concat(store.getters.groups)
                .concat(store.getters.subgroups)
                .concat(store.getters.contexts)
                //.concat(store.getters.datings)    // don't display on graph               
        })
        const edges = computed(() => store.getters.edges.filter(edge => edge.data.type == "above"))
        */
        const nodes = ref([])
        const edges = ref([])
        
        // refresh data from store
        const refreshDiagram = () => {
            const cyi = cy.value.instance
            if(!cyi) return

            busy.value = true 
            nodes.value = []
            edges.value = []

            nodes.value = []
                .concat(store.getters.phases)
                .concat(store.getters.groups)
                .concat(store.getters.subgroups)
                .concat(store.getters.contexts)
                .slice()
            
            //nodes.value.forEach(node => console.log(`${node.data.id} ${node.data.parent}`))
            
            edges.value = store.getters.edges
                .filter(edge => edge.data.type == EdgeType.ABOVE)
                .slice()

            //centre(cyi)
            //zoomFit(cyi)

            busy.value = false
        }

        const preConfig = (cyi) => {
            cyi.use(dagre)      // hierarchical layout algorithm 
            //cyi.use(elk)
            //cyi.use(klay)
            cyi.use(gridGuide)  // interactive guidelines for grid positioning
            cyi.use(cyCanvas)   // overlay canvas used or drawing phase lines
            cyi.use(panzoom)    // panzoom control on top left
            //cyi.use(navigator) 
            //cyi.use(domnode)
            //cyi.use(nodehtmllabel)  // not used, was to add labels to nodes
            //cyi.use(noOverlap)    // but not working...
            //cyi.use(popper)
            cyi.use($)
        }

        // notify store that a node or an edge has been selected in the diagram
        const elementSelected = async (event, element) => store.dispatch('setSelectedID', element.data?.id || "")
               
        // set up panzoom, grid, snap and guidelines
        const afterCreated = (cyi) => {            
            cyi.panzoom(config.panzoom)            
            cyi.gridGuide(config.gridguide)
        }       
        
        // export visible part of diagram to PNG file
        const exportPartPNG = (cyi) => exportPNG(cyi, false)
        // export entire diagram to PNG file
        const exportFullPNG = (cyi) => exportPNG(cyi, true)
        // export diagram to PNG file
        const exportPNG = (cyi, full=false) => {
            if(!cyi) return
            const png64 = cyi.png({full: full, output: 'blob'})                 
            const fileName = `phaser-${ timestamp() }.png`
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
        }

        // clear diagram
        const clear = (cyi) => {
            // clear local stored data
            nodes.value = []
            edges.value = []                      
            centre(cyi)
        }

        const centre = (cyi) => {            
            cyi.zoom(1)
            cyi.pan({x: 0, y: 0})
        }

        // zoom diagram to various scales
        const zoomFit = (cyi) => { if(cyi) cyi.fit() }
        const zoomIn = (cyi) => zoomMe(cyi, 1.25)
        const zoomOut = (cyi) => zoomMe(cyi, 0.75)
        const zoomMe = (cyi, zoomBy=1) => {
            if(!cyi) return
            cyi.zoom({
                level: cyi.zoom() * zoomBy,
                position: {
                    x: Math.round((cyi.extent().x1 + cyi.extent().x2) / 2),
                    y: Math.round((cyi.extent().y1 + cyi.extent().y2) / 2),
                }
            })
        }        

        //const redoLayout = (cyi, name="dagre") => {
        const redoLayout = (cyi) => {
            if(!cyi || locked.value) return      
            busy.value = true     
            clear(cyi)
            // get updated graph data from store before proceeding
            refreshDiagram() // note not async as need it to complete (or use await?)

            //let options = config.layoutDagre //default
            //switch(name) {
                //case "elk": options = config.layoutElk;break;
                //case "dagre": options = config.layoutDagre;break;  
                //case "klay": options = config.layoutKlay;break;    
               // case "breadthfirst": options = config.layoutBreadthFirst;break;        
            //}
            //cyi.nodes().noOverlap({ padding: 5 }) // not working?

            let layout = cyi.layout(config.layoutDagre)            
            layout.on('layoutstop', updateNodePositionsInStore())
            layout.run()
            
            //cyi.layout(config.layoutBreadthFirst).run() 
            //cyi.layout(config.layoutKlay).run() 
            //layoutDone()
            //cyi.nodes().noOverlap({ padding: 5 })
            //this.drawPhases(cyi)
            busy.value = false
        }  

        const updateNodePositionsInStore = async () => {
             const cyi = cy.value.instance
            if(!cyi) return
            //console.log("updating node positions")
            cyi.elements("node").forEach(node => { 
                store.dispatch('updateNodePosition', { data: node.data(), position: node.position() })
            })
        }
       
        // draw horizontal SVG phase lines on supplementary layer
        // phase lines are drawn relative to TOP of phase nodes
        const drawHorizontalPhaseLines = (ctx) => {
            if(!ctx) return

            const cyi = cy.value.instance 
            if(!cyi) return            
            
            let extent = cyi.extent()  

            cyi.elements('node[class = "phase"]').forEach(node => {
                // establish drawing extents
                let w = extent.w * 200 // ensure lines don't 'run out'
                let h = node.layoutDimensions().h    
                let x = extent.x1
                let y = node.position().y - (h / 2)                                          

                // line style for drawing (dashed red)
                ctx.strokeStyle = ElementColour.PHASE_FG // "red"
                ctx.lineWidth = 4
                ctx.setLineDash([12,4])

                // draw phase line                    
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(w, y)
                ctx.stroke() 
                        
                // draw phase labels (left and right)
                ctx.font = "2em Arial"
                ctx.textBaseline = "top"
                ctx.fillStyle = ElementColour.PHASE_FG
                const txt = node.data().label
                    
                // draw left phase label
                ctx.textAlign = "left"
                ctx.fillText(txt, extent.x1 + 10, y + 10)
                    
                // draw right phase label
                ctx.textAlign = "right"
                ctx.fillText(txt, extent.x2 - 10, y + 10)                    
            })         
        } 

        // draw double lines between contexts representing 'equal' stratigraphic relationships
        const equalLinks = computed(() => store.getters.edges.filter(link => link.data.type === EdgeType.EQUAL))
        const drawEqualRelationships = (ctx) => {
            if(!ctx) return

            const cyi = cy.value.instance 
            if(!cyi) return  

            // 'equal' relationships are not in the diagram as they would
            // interfere with the dagre layout - so get from store instead
            unref(equalLinks).forEach(link => {
                let sourceNode = store.getters.nodeByID(link.data.source)
                let targetNode = store.getters.nodeByID(link.data.target)

                let x1 = sourceNode.position.x
                let y1 = sourceNode.position.y
                let x2 = targetNode.position.x
                let y2 = targetNode.position.y  
                
                // we have central position of nodes, 
                // but will draw from border to border 
                let offset = (props.gridSize * 1.5) + 2
                // direction from 1 -> 2 or 2 -> 1 ?                
                if(x2 > x1) {
                    x1 += offset
                    x2 -= offset
                }
                else {
                    x1 -= offset
                    x2 += offset
                }

                // line style for drawing
                ctx.setLineDash([])
                ctx.strokeStyle = ElementColour.EDGE 
                ctx.lineWidth = 3
                
                // draw (double) lines 
                // between the contexts                      
                ctx.beginPath()
                ctx.moveTo(x1, y1 -3)
                ctx.lineTo(x2, y2 -3)
                ctx.stroke()
                ctx.moveTo(x1, y1 +3)
                ctx.lineTo(x2, y2 +3)
                ctx.stroke()
            })
        }
             
             
        onMounted(() => {
            const cyi = cy.value.instance 
            if(!cyi) return             

            // diagram locked by default
            cyi.autolock(locked.value)
            
            // 'position' and 'move' events don't return the node within the event
            // also they fire multiple times as you drag across the grid, so using
            // 'tapend' instead (alt 'vmouseup') and just assume the node has moved
            cyi.on('tapend', 'node', function(evt) {
                let data = evt.target.data()
                let position = evt.target.position()
                //console.log(position)
                //store.dispatch('updateNodePosition', evt.target)
                store.dispatch('updateNodePosition', { data: data, position: position })
            })              

            // drawing lines on supplementary layer 
            // (phase lines and equals relationships)
            let layer = cyi.cyCanvas()
            let canvas = layer.getCanvas()
            let ctx = canvas.getContext('2d')

            cyi.on("render pan", () => {
                // prepare layer for drawing
                layer.resetTransform(ctx)
                layer.clear(ctx)
                layer.setTransform(ctx)

                drawHorizontalPhaseLines(ctx)
                drawEqualRelationships(ctx)
            })            
            
            // override height setting on cytoscape-vue div, else always 600px!
            // see https://github.com/rcarcasses/vue-cytoscape/issues/47
            document.getElementById("cytoscape-div").style.minHeight="900px" 
                    
            // event bus message handlers (for received events fired from menu bar)
            EventBus.$on("diagram-clear", () => clear(cyi))
            EventBus.$on("diagram-refresh", () => refreshDiagram(cyi))
            EventBus.$on("diagram-zoom-in", () => zoomIn(cyi)) 
            EventBus.$on("diagram-zoom-out", () => zoomOut(cyi))
            EventBus.$on("diagram-zoom-fit", () => zoomFit(cyi))
            EventBus.$on("diagram-export-part-png", () => exportPartPNG(cyi))
            EventBus.$on("diagram-export-full-png", () => exportFullPNG(cyi))
            EventBus.$on("diagram-redo-layout", name => redoLayout(cyi, name))      
            // this one fired from ItemEditor - re-layout contents of this node
            EventBus.$on("diagram-redo-compound-layout", node => {
                let cyNode = cyi.$id(node?.data?.id)
                if(!cyNode) return
                // get TL position of compound node prior to redoing layout
                let bbox1 = cyNode.boundingBox()
                let tlPos = { x: bbox1.x1, y: bbox1.y1 }
                
                // only redo layout for descendant
                // nodes and their associated edges
                let cyNodes = cyNode.descendants()
                let cyEdges = cyNodes.edgesWith(cyNodes)
                let layout =  cyNodes.merge(cyEdges).layout(config.layoutDagre)
                layout.on('layoutstop', updateNodePositionsInStore())
                layout.run() 
                
                // compound node itself may have moved - restore to previous position   
                let bbox2 = cyNode.boundingBox() 
                let newPos = {
                    x: (tlPos.x + (bbox2.w / 2)) - 5, // not sure why -5 but it works??
                    y: (tlPos.y + (bbox2.h / 2))
                }        
                cyNode.position(newPos)
                // inform the store about the new position
                store.dispatch('updateNodePosition', { data: cyNode.data(), position: cyNode.position() })
                //store.dispatch('updateNode', { data: node.data, position: newPos })
            }) 

            // ensure parent change in data is reflected on diagram, 
            // cytoscape data.parent is immutable so must call 'move'
            EventBus.$on("node-parent-changed", (node) => {
                let cyNode = cyi.$id(node.data.id)
                if(cyNode && node.data.parent !== "")
                    cyNode.move({ parent: node.data.parent }) 
                else    // removing from group
                    cyNode.move({ parent: null })
            })
        })

        onBeforeUnmount(() => {
            // clear EventBus listeners to avoid memory leaks. See:
            // https://blog.usejournal.com/vue-js-best-practices-c5da8d7af48d
            // EventBus.$off('node-parent-changed')
            // EventBus.$off("diagram-clear")
            // EventBus.$off("diagram-zoom-in") 
            // EventBus.$off("diagram-zoom-out")
            // EventBus.$off("diagram-zoom-fit")
            // EventBus.$off("diagram-export-part-png")
            // EventBus.$off("diagram-export-full-png")
            // EventBus.$off("diagram-redo-layout")      
            // EventBus.$off("redo-compound-node-layout")

            // ensure current node positions are stored for next time
            // updateNodePositionsInStore()
        })

        return {
            cy, 
            busy,
            locked,
            config,
            nodes,
            edges,
            preConfig,
            afterCreated,
            lockChanged,
            //drawPhases,
            //drawPhases2,
            elementSelected,
            refreshDiagram,            
            //showTippy,
            //hideTippy
        }
    }
}
</script>

<style>
    #lock { top: 0px; left: 15px; z-index: 100; }
    #refresh { top: 0px; left: 50px; z-index: 100; }
    #legend { top: 0px; right: 0px; z-index: 100; }
    

    /* NodeHtmlLabel */
    .subgrouplabel {
        font-size: 2em;
        font-family: sans-serif;        
        color: blue;
        padding: 6px;
    }
    /*#navigator {
        left: 10px;
        bottom: 10px;
        z-index: 99999;
        width: 175px;
        height: 175px;
        position: fixed;         
        border: #828282 1px solid;
        border-radius: 2px;
        background-color: white;
        opacity: 1.0;
        cursor: default;
        overflow: hidden;
    }
   

#navigator > img{
	max-width: 100%;
	max-height: 100%;
}

#navigator > canvas{
	position: absolute;
	top: 0;
	left: 0;
	z-index: 101;
}

#navigator .cytoscape-navigatorView{
	position: absolute;
	top: 0;
	left: 0;
	cursor: move;
	background: #B7E1ED;
	-moz-opacity: 0.50;
	opacity: 0.50;
	-ms-filter:"progid:DXImageTransform.Microsoft.Alpha"(Opacity=50);
	z-index: 102;
}

#navigator .cytoscape-navigatorOverlay{
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 103;
}*/
.phase {
    visibility: "hidden";    
}
/*.myphase {
    width: 100%;
    border-color: purple;
    border-style: dashed;
    border-width: 5px;
    background-color: salmon;
}*/

/* make the 'no zoom' tick invisible */
.cy-panzoom-no-zoom-tick {
    display: none;
}

</style>