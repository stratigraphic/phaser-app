<template>
    <div id="holder">
         <b-button pill
            size="sm"
            variant="primary"
            class="text-left shadow" 
            title="Refresh diagram" 
            alt="Refresh diagram"			
            @click.stop="refresh()">
            <b-icon-arrow-clockwise />
            <span>Refresh diagram</span>
        </b-button>	
        <div id="holder" class="overflow-auto w-100">
        
            <cytoscape 
                id="groupmatrix" 
                ref="cy" 
                :config="config"
                :preConfig="preConfig">            
                    
                <cy-element v-for="node in elements.nodes" 
                    id="node.data.id"            
                    :key="node.data.id"
                    :class="node.data.class"
                    :definition="node"/>
                    
                <cy-element v-for="edge in elements.edges"
                    :key="edge.data.id"
                    :class="edge.data.class"                
                    :definition="edge"/>            
            </cytoscape>
        </div>
    </div>
</template>

<script>
import { shallowRef, computed, inject, onMounted } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { EdgeType, NodeClass, ElementColour } from '@/composables/PhaserCommon'
import dagre from 'cytoscape-dagre'

export default {
    props: {
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },
        items: {
            type: Array,
            required: false,
            default: () => []
        },
        gridSize: {
            type: Number,
            required: false,
            default: 40
        }
    },
    setup(props) {
        const store = inject('store')
        const cy = shallowRef(null)

        const elements = computed(() => {
            // TODO...generate from props.items
            /*return {
                nodes: [
                    { data: { id: 'a' } },
                    { data: { id: 'b' } }
                ],
                edges: [
                    { data: { id: 'ab', source: 'a', target: 'b' } }
                ]               
            }*/

            let nodes = store.getters.groups
            let edges = props.items
                .filter(item => item.stratRelationship == EdgeType.ABOVE)
                .map(item => {
                    return {
                        data: {
                            source: item.sourceID,
                            target: item.targetID
                        }
                    }
                })

            return {
                nodes: nodes,
                edges: edges
            }



            /*items.value.map(item => {
                return [
                    `"${item.sourceLabel}"`,
                    item.sourceDates.minYear,
                    item.sourceDates.maxYear,
                    item.stratRelationship,
                    item.tempRelationship,
                    `"${item.targetLabel}"`,
                    item.targetDates.minYear,
                    item.targetDates.maxYear,
                ].join()
            })*/
        })

        const config = {
            pixelRation: 1,
            selectionType: 'single',
            minZoom: 0.05,
            maxZoom: 2.0, 
                          
            layoutDagre: {
                name: 'dagre', 
                // dagre options, uses default value if undefined
                nodeSep: props.gridSize - 4, // the separation between adjacent nodes in the same rank
                edgeSep: props.gridSize, // the separation between adjacent edges in the same rank                    
                rankSep: (props.gridSize * 2) - 4, // the separation between each rank in the layout
                marginx: props.gridSize / 2,
                marginy: props.gridSize / 2,                    
                rankDir: 'TB', // 'TB' for top to bottom flow, 'LR' for left to right
                ranker: 'network-simplex', // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
                minLen: function( edge ){ return edge ? 1 : 1 }, // number of ranks to keep between the source and target of the edge
                //edgeWeight: function( edge ){ return 1; }, // higher weight edges are generally made shorter and straighter than lower weight edges

                // general layout options
                fit: true, // whether to fit to viewport
                padding: props.gridSize / 2, // fit padding
                spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
                nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
                animate: false, // whether to transition the node positions
                boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                //transform: function( node, pos ){ return pos; }, // a function that applies a transform to the final node position
                //zoom: function(e){ console.log("zoom"); console.log(e)},
                //viewport: function(e){ console.log("viewport"); console.log(e)},
                ready: layoutReady, // on layoutready
                stop: layoutStop // on layoutstop              
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
                        'width': props.gridSize * 2,
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
                    selector: `node[class="${NodeClass.GROUP}"]`,
                    style: {
                        'shape': 'round-rectangle',
                        'label':  el => `${el.data('label') ? el.data('label') : el.data('id')}`, 
                        'text-opacity': 1.0,
                        //'text-valign': 'top',
                        //'text-halign': 'right',
                        //'text-margin-x': 5,
                        'text-margin-y': 2,
                        'color': ElementColour.GROUP_FG,                        
                        'background-color': ElementColour.GROUP_BG,
                        'border-color': ElementColour.GROUP_FG,                        
                    }
                }, 
                {                       
                    selector: `node[class="${NodeClass.GROUP}"]:selected`,
                    style: { 'background-color': ElementColour.SELECTED_BG }
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
                        //'target-arrow-color': ElementColour.EDGE,
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
                    style: { 'line-color': ElementColour.EDGE_SELECTED }
                },
            ]                
        }

        const preConfig = (cyi) => {
            cyi.use(dagre)            
        }

        const refresh = async () => {
            const cyi = cy.value.instance
            if(!cyi) return	
            cyi.layout(config.layoutDagre).run()
            //cyi.fit(null, 200)

            // centre...      
            //cyi.zoom(1)
            //cyi.pan({x: 0, y: 0}) 
            cyi.fit()   
        }

        const layoutReady = () => { console.log("layoutready") }
        const layoutStop = () => { console.log("layoutstop") }   

        onMounted(() => {
            // override height setting on cytoscape-vue div, else always 600px!
            // see https://github.com/rcarcasses/vue-cytoscape/issues/47
            document.getElementById("cytoscape-div").style.minHeight="900px" 
        })

        

        return { cy, store, refresh, elements, config, preConfig }
    }
}
</script>