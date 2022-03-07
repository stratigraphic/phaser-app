<template>	
    <b-container fluid class="p-0 m-0">            
        <b-row>
            <b-col>
                <div class="p-2 text-center">Derived stratigraphic relationships between elements within phase {{ selectedPhaseLabel }}</div>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-table sort-icon-left outlined small show-empty
                    id="datatable-stratigraphic"                    
                    :busy="isBusy"
                    style="height: 250px;"
                    :no-border-collapse="true"
                    sticky-header="250px" 
                    select-mode="single"
                    :filter-ignored-fields="['sourceID', 'targetID']"
                    :filter-included-fields="['sourceLabel', 'stratRelationship','tempRelationship', 'targetLabel']"
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
                    <template #cell(sourceLabel)="row">
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
            <b-col>Showing {{ filterCount }} of {{ items.length }} records</b-col>
        </b-row>
    </b-container>
</template>

<script>
import { ref, inject, computed, watch } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
//import { BBreadcrumbLink } from 'bootstrap-vue'
import { EdgeType, rangeRelationship, isContext, relationshipStatus } from '@/composables/PhaserCommon'
import NodeIconLink from '@/components/NodeIconLink'
import YearRangeDisplay from '@/components/YearRangeDisplay'

export default {
    components: { 
        NodeIconLink, 
        YearRangeDisplay 
    },
    props: {
        phaseID: {
            type: String,
            required: false,
            default: ""
        },
        filter: {
            type: String,
            required: false,
            default: ""
        }
    },
    setup(props) {
        const store = inject('store')
		const items = ref([])	
        const isBusy = ref(false)

        const filterCount = ref(0)
        const onFiltered = (items, count) => {
            filterCount.value = count
        }
        
        const selectedPhaseLabel = computed(() => store.getters.labelByID(props.phaseID))

        // conditional colour coding for rows
        const rowClass = (item, type) => {
            if (!item || type !== 'row') 
                return
            
            let sourceNodeClass = store.getters.classByID(item.sourceID)
            let targetNodeClass = store.getters.classByID(item.targetID)
            return relationshipStatus(sourceNodeClass, targetNodeClass, item.stratRelationship, item.tempRelationship)
            //console.log(status)
            
            /*
            else if(item.tempRelationship == "" || item.stratRelationship == "")
                return 'table-light'
            else if ([AllenType.BEFORE, AllenType.MEETS].includes(item.tempRelationship) && item.stratRelationship == EdgeType.BELOW)
                return 'table-success'            
            else if([AllenType.AFTER, AllenType.METBY].includes(item.tempRelationship) && item.stratRelationship == EdgeType.ABOVE)
                return 'table-success'
            else
                return 'table-danger'
            */
        }
        
        const fields = [                   
            {
				key: "sourceLabel",
				label: "id",
                sortable: true,
				sortByFormatted: true,
				formatter: (value, key, item) => `${item.sourceClass}${item.sourceLabel}`,		
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
				formatter: (value, key, item) => `${item.targetClass}${item.targetLabel}`,						
			},
            {		
				key: 'targetDates',
				label: 'years',                
				sortable: false					
			},              
        ]   
        
        const phaseID = computed(() => props.phaseID)
        watch(phaseID, async (newValue) =>  { 
            isBusy.value = true
            filterCount.value = 0
            items.value = []            
            items.value = await getDSRforPhase(newValue) 
            filterCount.value = items.value.length
            isBusy.value = false
        })   
        
        const getDSRforPhase = async phaseID => {
            const dsr = []

            // ensure its a valid phase ID before proceeding
            let phase = store.getters.nodeByID(phaseID)
            if(!phase) return dsr

            // get ancestry of each context within the phase
            const contextAncestry = new Map()
            store.getters
                .descendantsOfID(phaseID)   // all elements within the specified phase
                .filter(isContext)          // filtered to only contexts
                .forEach(context => {
                    const ancestors = store.getters
                        .ancestorsOfNode(context)   // elements hierarchically containing this context
                        .map(node => node.data.id)  // we only need the identifier not the full node
                        .concat(context.data.id)    // add ID of this context (because not included in ancestors)
                    contextAncestry.set(context.data.id, ancestors) // storing array of ancestor IDs for this context
                })
            
            // for all 'above' edge relationships connecting contexts WITHIN the specified phase..
            store.getters.edges
                .filter(edge => contextAncestry.has(edge.data.source) && contextAncestry.has(edge.data.target)) 
                .filter(edge => edge.data.type === EdgeType.ABOVE)            
                .forEach(edge => {

                    // get ancestry of both source and target contexts               
                    let sourceAncestry = new Set(contextAncestry.get(edge.data.source))
                    let targetAncestry = new Set(contextAncestry.get(edge.data.target))
                    
                    // remove any IDs the 2 sets have in common
                    sourceAncestry.forEach(id => {
                        if(targetAncestry.has(id)) {
                            sourceAncestry.delete(id)
                            targetAncestry.delete(id)
                        }
                    })               

                // all IDs in the source list are ABOVE all IDs in the target list?
                // not quite - strat rels can traverse into parallel groups and back
                sourceAncestry.forEach(sourceID => {
                    let sourceClass = store.getters.classByID(sourceID)
                    let sourceLabel = store.getters.labelByID(sourceID) 
                    let sourceDates = store.getters.derivedNodeDates(sourceID)
                    targetAncestry.forEach(targetID => {
                        let targetClass = store.getters.classByID(targetID)
                        let targetLabel = store.getters.labelByID(targetID)
                        let targetDates = store.getters.derivedNodeDates(targetID)
                        
                        dsr.push({ 
                            sourceClass: sourceClass,
                            targetClass: targetClass,  
                            sourceID: sourceID, 
                            targetID: targetID, 
                            sourceLabel: sourceLabel,
                            targetLabel: targetLabel,
                            sourceDates: sourceDates,
                            targetDates: targetDates, 
                            stratRelationship: EdgeType.ABOVE,
                            tempRelationship: rangeRelationship(sourceDates, targetDates)
                        })
                        // add reciprocal 'below' relationship
                        /*dsr.push({ 
                            sourceClass: targetClass, 
                            targetClass: sourceClass,  
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
            })
            
            return dsr
        }
            









        /*
            // ensure its a valid phase ID before proceeding
            let phase = store.getters.nodeByID(phaseID)
            if(!phase) return dsr

            // get derived year ranges for all dated groups, subgroups and contexts within this Phase              
            let dates = new Map()
            store.getters
                .descendantsOfID(phaseID)
                .filter(n => [NodeClass.GROUP, NodeClass.SUBGROUP, NodeClass.CONTEXT].includes(n.data.class))
                .forEach(element => {
                    // get derived dates for this element
                    const elementDates = store.getters.derivedNodeDates(element.data.id)
                     // only include if valid derived year range                    
                    if(isValidRange(elementDates)) dates.set(element.data.id, elementDates)                       
                })
            
            // compare each date range to generate temporal relationships between all elements 
            // note - labels are inserted here so they can be used for table filtering later          
            dates.forEach((sourceDates, sourceID) => {
                let sourceLabel = store.getters.labelByID(sourceID, true)
                dates.forEach((targetDates, targetID) => {
                    if(sourceID !== targetID) {
                         atr.push({ 
                            source: sourceID, 
                            target: targetID, 
                            sourceLabel: sourceLabel,
                            targetLabel: store.getters.labelByID(targetID, true),
                            sourceDates: sourceDates,
                            targetDates: targetDates,
                            rel: rangeRelationship(sourceDates, targetDates) 
                        })
                    }
                })                    
            })*/

            //return dsr
        //}

        // Get Allen Temporal Relationships (ATRs) for specified node id
        /*const getATR = async id => {
            const atr = []
            
            let node = store.getters.nodeByID(id)

            // get the phase this node is contained within            
            let phase = store.getters.ancestorsOfNode(node).find(n => n.data.class == NodeClass.PHASE)
            // if not within a phase then we return nothing
            if(!phase) return atr

            // get derived dates for all groups, subgroups or contexts within the same Phase            
            let items = store.getters.descendantsOfID(phase.data.id)
                .filter(n => n.data.id !== id) // dont compare this node to itself!
                .filter(n => [NodeClass.GROUP, NodeClass.SUBGROUP, NodeClass.CONTEXT].includes(n.data.class))
                //.filter(n => isValidRange(n.data.dating))
            
            // compare other items' derived dates to this node's derived dates
            // (only consider items with valid derived dates)
            const sourceDates = store.getters.derivedNodeDates(id)                   
            if(isValidRange(sourceDates)) {   
                items.forEach(item => {
                    const targetDates = store.getters.derivedNodeDates(item.data.id)
                    if(isValidRange(targetDates)) {                        
                        let rel = rangeRelationship(sourceDates, targetDates)
                        atr.push({ source: node.data.id, target: item.data.id, rel: rel })
                    }
                })
            }
            return atr
        }*/

		return { 
            store, 
            fields, 
            filterCount,
            onFiltered,
            selectedPhaseLabel, 
            items, 
            isBusy,
            rowClass
        }
	}
}
</script>
<style lang="css" scoped>
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