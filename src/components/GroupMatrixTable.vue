<template>	
    <b-container fluid class="p-2">            
       <b-row>	
            <b-col>
				<b-button pill
					size="sm"
					variant="primary"
					class="text-left shadow mr-2" 
					title="Refresh table" 
					alt="Refresh table"			
					@click.stop="refresh()">
					<b-icon-arrow-clockwise />Refresh table</b-button>   
                <b-button pill
					size="sm"
					:disabled="items.length == 0"
					variant="primary"
					class="text-left shadow" 
					title="Copy to clipboard" 
					alt="Copy to clipboard"			
					@click.stop="itemsToClipboard()">
                    <b-icon-clipboard-plus class="mr-2" />
                    <span>Copy to clipboard</span>
                    </b-button>            
			</b-col>
			<b-col>
				<b-form-group
					label="Filter"
					label-for="filter-input"
					label-cols-sm="3"
					label-align-sm="right"
					label-size="sm"
					class="mb-2">
					<template v-slot:label><b-icon-search /></template>
					<b-form-input 
						size="sm"
						id="filter-input"
						class="shadow-sm"
						v-model="filter"
						type="search"
						autocomplete="off"
						placeholder="filter records"/>		
                    <div class="text-secondary">Showing {{ filterCount }} of {{ items.length }} records</div>				
				</b-form-group>
			</b-col>
		</b-row>
        <b-row>
            <b-col>
                <b-table sort-icon-left outlined small show-empty
                    ref="groupmatrix"
                    id="groupmatrix"                    
                    :busy="isBusy"                        
                    :no-border-collapse="true"
                    :sticky-header="true" 
                    select-mode="single"
                    :filter-ignored-fields="[ 'sourceID', 'targetID' ]"
                    :filter-included-fields="[ 'sourceLabel', 'targetLabel', 'stratRelationship', 'tempRelationship' ]"
                    :filter="filter"
                    @filtered="onFiltered"
                    :items="items" 
                    :fields="fields"
                    class="shadow-sm"
                    :tbody-tr-class="rowClass">
                    <template #thead-top>
                        <b-tr>
                            <b-th colspan="2" class="text-center">source</b-th>
                            <b-th colspan="2" class="text-center border-left border-right">relationship</b-th>
                            <b-th colspan="2" class="text-center">target</b-th>                   
                        </b-tr>
                    </template>                   
                    
                    <template #cell(sourceLabel)="row" >
                        <NodeIconLink :nodeID="row.item.sourceID"/>
                    </template>
                    <template #cell(targetLabel)="row">
                        <NodeIconLink :nodeID="row.item.targetID"/>
                    </template>
                    <template #cell(sourceDates)="row">
                        <YearRangeDisplay 
                            :minYear="row.item.sourceDates.minYear" 
                            :maxYear="row.item.sourceDates.maxYear" 
                            :showDuration="true"/>                                              
                    </template> 
                    <template #cell(targetDates)="row">
                        <YearRangeDisplay 
                            :minYear="row.item.targetDates.minYear" 
                            :maxYear="row.item.targetDates.maxYear" 
                            :showDuration="true"/>
                    </template>      
                </b-table>
            </b-col>
        </b-row>       
        <b-row>
            <b-col>
                <GroupMatrixDiagram :items="items"/>
            </b-col>
        </b-row>
        <!--<b-row>
            <b-col>
                <NodeTypeAhead :nodes="store.getters.contexts"/>
            </b-col>
        </b-row>-->
    </b-container>
</template>

<script>
import { ref, shallowRef, inject } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
//import { set } from 'vue/types/umd'
import { NodeClass, EdgeType, isGroup, rangeRelationship, relationshipStatus } from '@/composables/PhaserCommon'
import GroupMatrixDiagram from '@/components/GroupMatrixDiagram'
import NodeIconLink from '@/components/NodeIconLink'
import YearRangeDisplay from '@/components/YearRangeDisplay'
//import NodeTypeAhead from "@/components/NodeTypeAhead"
import Papa from "papaparse"

export default {
    components: { 
        GroupMatrixDiagram, 
        NodeIconLink,
        YearRangeDisplay
    },
    props: {
        disabled: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    setup() {
        const store = inject('store')
		const items = ref([])
        const groupmatrix = shallowRef(null)
        const isBusy = ref(false)

        const fields = [                    
            {
				key: "sourceLabel",
				label: "id",
                sortable: true,
				sortByFormatted: true,
				formatter: (value, key, item) => item.sourceLabel,			
			}, 
            {		
				key: 'sourceDates',
				label: 'years',                
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
				label: "id",
                sortable: true,
				sortByFormatted: true,
				formatter: (value, key, item) => item.targetLabel,			
			},
            {		
				key: 'targetDates',
				label: 'years',                
				sortable: false					
			},              
        ] 
        
        // conditional colour coding for rows
        const rowClass = (item, type) => {
            if (!item || type !== 'row') 
                return
            
            let sourceNodeClass = store.getters.classByID(item.sourceID)
            let targetNodeClass = store.getters.classByID(item.targetID)
            return relationshipStatus(sourceNodeClass, targetNodeClass, item.stratRelationship, item.tempRelationship)            
        }

        const filter = ref("")	
        const filterCount = ref(0)	       
        const onFiltered = (items, count) => {
            filterCount.value = count
        }

        const refresh = async () => {
            isBusy.value = true
            items.value = []
            filter.value = ""
            filterCount.value = 0
            items.value = await getGroupRelationships()
            filterCount.value = items.value.length
            isBusy.value = false
        }

        const itemsToClipboard = () => {

            let data = items.value.map(item => {
                return {
                    sourceID: item.sourceLabel,
                    sourceMinYear: item.sourceDates.minYear,
                    sourceMaxYear: item.sourceDates.maxYear,
                    stratigraphic: item.stratRelationship,
                    temporal: item.tempRelationship,
                    targetID: item.targetLabel,
                    targetMinYear: item.targetDates.minYear,
                    targetMaxYear: item.targetDates.maxYear,
                }
            })
            let tsv = Papa.unparse(JSON.stringify(data), { delimiter: "\t" })            
            navigator.clipboard.writeText(tsv)
        } 

        // new - need better algorithm..
        const getGroupRelationships = async () => {
            const contextData = new Map()

            // for each context
            store.getters.contexts.forEach(context => {

                 // get group containing this context 
                 // (note - there might not be one)
                const group = store.getters
                    .ancestorsOfNode(context)
                    .find(isGroup) || null 

                // create initial contextData record
                contextData.set(context.data.id, { 
                    contextID: context.data.id,
                    inGroupID: group ? group.data.id : null,
                    above: new Set() 
                })
            })
            
            // add all 'context ABOVE context' relationships 
            store.getters.edges
                .filter(edge => edge.data.type === EdgeType.ABOVE)
                .forEach(edge => {   
                    let item = contextData.get(edge.data.source)
                    item.above.add(edge.data.target)             
                }) 

            // recursive function to find next grouped contexts below specified contextID
            const groupedContextsBelow = (contextID) => {
                let groupedContextIDs = new Set()
                let item = contextData.get(contextID)
                item.above.forEach(childID => {
                    let child = contextData.get(childID)
                    if(child.inGroupID) groupedContextIDs.add(childID)
                    else if (child.above.size > 0) {
                        let groupedDescendants = groupedContextsBelow(childID)
                        groupedContextIDs = new Set([...groupedContextIDs, ...groupedDescendants])                        
                    }  
                })
                return [...groupedContextIDs]
            }                

            // replace any non-grouped child contexts with grouped contexts below them
            contextData.forEach(item => {
                if(item.inGroupID) {
                    item.above.forEach(id => {
                        let childItem = contextData.get(id)
                        if(!childItem.inGroupID) {
                            let replacements = groupedContextsBelow(id)
                            item.above.delete(id)
                            replacements.forEach(contextID => item.above.add(contextID))
                        }
                    }) 
                }                   
            })
            
            // prepare map to hold relationships for each group
            const groupData = new Map()
            store.getters.groups.forEach(group => {
                groupData.set(group.data.id, {
                    id: group.data.id,
                    label: store.getters.labelByID(group.data.id, false),
                    dates: store.getters.derivedNodeDates(group.data.id),
                    above: new Set()
                })
            })
            
            // build group->group relationships from context->context relationships
            contextData.forEach(item => {
                let sourceGroupID = item.inGroupID
                item.above.forEach(targetID => {
                    let targetGroupID = contextData.get(targetID).inGroupID                
                    // if not the same group then sourceID _could_ be ABOVE targetID
                    // (but not necessarily, hence subsequent check for cycles below)
                    if(sourceGroupID && targetGroupID && sourceGroupID !== targetGroupID) {
                        let groupDataItem = groupData.get(sourceGroupID)
                        groupDataItem.above.add(targetGroupID)                    
                    }
                })
            })

            // check for (and eliminate) cycles in the resultant data (i.e. A above B, B above A)  
            // these can be introduced where strat relationships traverse between parallel groups
            groupData.forEach(sourceItem => {
                sourceItem.above.forEach(id => {
                    let targetItem = groupData.get(id)
                    if(targetItem.above.has(sourceItem.id)) {
                        targetItem.above.delete(sourceItem.id)
                        sourceItem.above.delete(targetItem.id)
                    }
                })                
            })

            // finally build results array
            let results = []
            groupData.forEach(item => {
                item.above.forEach(targetID => {
                    const sourceID = item.id
                    const sourceLabel = item.label
                    const sourceDates = item.dates                    
                    const targetLabel = groupData.get(targetID).label
                    const targetDates = groupData.get(targetID).dates
                    
                    // add 'above' relationship to results
                    results.push({ 
                        sourceID: sourceID,
                        targetID: targetID,                         
                        sourceLabel: sourceLabel,
                        targetLabel: targetLabel,                        
                        sourceDates: sourceDates,
                        targetDates: targetDates,                        
                        stratRelationship: EdgeType.ABOVE,
                        tempRelationship: rangeRelationship(sourceDates, targetDates)
                    })

                    // add reciprocal 'below' relationship to results
                    /*results.push({ 
                        sourceID: targetID, 
                        targetID: sourceID, 
                        sourceLabel: targetLabel,
                        targetLabel: sourceLabel,
                        sourceDates: targetDates,
                        targetDates: sourceDates, 
                        stratRelationship: EdgeType.BELOW,
                        tempRelationship: rangeRelationship(targetDates, sourceDates)
                    })*/                                    
                })
            }) 
            return results           
        }

        return { 
            store, 
            fields,
            NodeClass,
            groupmatrix, 
            itemsToClipboard,
            items, 
            isBusy, 
            filter, 
            filterCount, 
            onFiltered, 
            rowClass, 
            refresh 
        }
    }
}
</script>
<style lang="css" scoped>
/deep/ .status-valid {
    background-color: #c3e6cb;    
}
/deep/ .status-uncertain {
    background-color: gold; 
}
/deep/ .status-needsmore {
    background-color: moccasin; 
}
/deep/ .status-invalid {
    background-color: #f5c6cb;
}
/deep/ .status-unknown {
    background-color: white;
}
</style>