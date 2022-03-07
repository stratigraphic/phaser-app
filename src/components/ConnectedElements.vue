<template>
    <div>
        <div>Relationships</div>
        <b-table sort-icon-left outlined small show-empty
            ref="relationships"
            id="relationships"  
            style="height: 150px;"                  
            :no-border-collapse="true"
            :sticky-header="true" 
            :items="tableData" 
            :fields="tableFields"
            class="shadow-sm"
            :tbody-tr-class="rowClass">
            <template #cell(sourceLabel)="row">
                <NodeIconLink :nodeID="row.item.sourceID"/>
            </template>
            <template #cell(targetLabel)="row">
                <NodeIconLink :nodeID="row.item.targetID"/>
            </template>
            <template #cell(sourceDates)="row">
                <YearRangeDisplay 
                    :minYear="row.item.sourceDates.minYear" 
                    :maxYear="row.item.sourceDates.maxYear"/>                                                    
            </template> 
            <template #cell(targetDates)="row">
                <YearRangeDisplay 
                    :minYear="row.item.targetDates.minYear" 
                    :maxYear="row.item.targetDates.maxYear"/>                
            </template>
        </b-table>
    </div>      
</template>
<script>
import { inject, computed } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
import { rangeRelationship, isPhase, isGroup, isSubGroup, isContext, relationshipStatus } from '@/composables/PhaserCommon'
import NodeIconLink from '@/components/NodeIconLink'
import YearRangeDisplay from '@/components/YearRangeDisplay'

export default {
    components: { 
        NodeIconLink, 
        YearRangeDisplay 
    },
    props: {
        contextID: {
			type: String,
			required: false,
			default: ""	
		}
    },
	setup(props) {
		const store = inject('store')        
       
        // conditional colour coding of rows
        const rowClass = (item, type) => {
            if (!item || type !== 'row') 
                return             
            
            let sourceNodeClass = store.getters.classByID(item.sourceID)
            let targetNodeClass = store.getters.classByID(item.targetID)
            return relationshipStatus(sourceNodeClass, targetNodeClass, item.stratRelationship, item.tempRelationship)
        } 
        
        // get subset of elements connected either by stratigraphy or by containment
        const getConnectedElements = nodeID => {

            // get direct stratigraphic links to/from specified node
            let connectedEdges = []
                .concat(store.getters.edgesBySource(nodeID))
                .concat(store.getters.edgesByTarget(nodeID))
            
            // get unique IDs for all connected elements
            // (connected by stratigraphy or containment)
            let connectedNodeIDs = new Set()

            connectedEdges.forEach(edge => {
                // add source and target IDs
                connectedNodeIDs.add(edge.data.source)
                connectedNodeIDs.add(edge.data.target)

                // add source node ancestry IDs (includes subgroups, groups and phases)
                store.getters
                    .ancestorsOfID(edge.data.source)
                    .map(node => node.data.id)
                    .forEach(id => connectedNodeIDs.add(id))

                // add target node ancestry IDs (includes subgroups, groups and phases)
                store.getters
                    .ancestorsOfID(edge.data.target)
                    .map(node => node.data.id)
                    .forEach(id => connectedNodeIDs.add(id))
            })
            
            // get all elements in the identified subset of IDs
            let connectedNodes = [...connectedNodeIDs].map(id => store.getters.nodeByID(id))                
            
            // need to be ordered, for diagram nesting to work
            // (we may want to display this data in Cytoscape)
            let phases = connectedNodes.filter(isPhase)
            let groups = connectedNodes.filter(isGroup)
            let subgroups = connectedNodes.filter(isSubGroup)
            let contexts = connectedNodes.filter(isContext)
            
            return {
                nodes: [].concat(phases).concat(groups).concat(subgroups).concat(contexts),
                edges: connectedEdges
            }
        }

        const tableData = computed(() => {
            const connectedElements = getConnectedElements(props.contextID)

            return connectedElements.edges.map(edge => {
                const sourceDates = store.getters.derivedNodeDates(edge.data.source)
                const targetDates = store.getters.derivedNodeDates(edge.data.target)

                return { 
                    sourceID: edge.data.source,
                    sourceClass: store.getters.classByID(edge.data.source),
                    sourceLabel: store.getters.labelByID(edge.data.source),
                    sourceDates: sourceDates,
                    stratRelationship: edge.data.type,
                    tempRelationship: rangeRelationship(sourceDates, targetDates),
                    targetClass: store.getters.classByID(edge.data.target),
                    targetID: edge.data.target,
                    targetLabel: store.getters.labelByID(edge.data.target),
                    targetDates: targetDates,
                }
            })
        })

        const tableFields = [
            {
				key: "sourceLabel",
				label: "source",
                sortable: true,
				sortByFormatted: true,
				formatter: (value, key, item) => `${item.sourceClass}${item.sourceLabel}`,				
			}, 
            {		
				key: 'sourceDates',
				label: 'dates',                
				sortable: false					
			},           
            {		
				key: 'stratRelationship',
				label: 'stratigraphic',
				sortable: true					
			},
            {		
				key: 'tempRelationship',
				label: 'temporal',
				sortable: true					
			},
            {
				key: "targetLabel",
				label: "target",
                sortable: true,
				sortByFormatted: true,
				formatter: (value, key, item) => `${item.targetClass}${item.targetLabel}`,			
			}, 
            {		
				key: 'targetDates',
				label: 'dates',                
				sortable: false					
			}, 
        ]
        
		return { store, rowClass, tableFields, tableData }
	}

}
</script>

<style scoped>
#holder {
    height: 200px;
    width: 100%;
}
a:hover {
	color: red;	
}
/deep/ .status-valid {
    background-color: #c3e6cb;    
}
/deep/ .status-uncertain {
    background-color: gold; /* was #ffeeba; */
}
/deep/ .status-needsmore {
    background-color: moccasin; /* was lightyellow; */
}
/deep/ .status-invalid {
    background-color: #f5c6cb;
}
/deep/ .status-unknown {
    background-color: white;
}
</style>