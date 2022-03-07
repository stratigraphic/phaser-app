<template>	
    <b-container fluid class="p-0 m-0">            
        <b-row>
            <b-col>
                <div class="p-2 text-center">Derived temporal relationships between elements within phase {{ selectedPhaseLabel }}</div>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-table sort-icon-left outlined small show-empty 
                    id="datatable-temporal" 
                    :busy="isBusy"
                    style="height: 250px;"                                   
                    :no-border-collapse="true"
                    sticky-header="250px" 
                    select-mode="single"
                    :filter-ignored-fields="['source', 'target']"
                    :filter-included-fields="['sourceLabel', 'relationship', 'targetLabel']"
                    :filter="filter"
                    @filtered="onFiltered"
                    :items="items" 
                    :fields="fields"
                    class="shadow-sm">
                    <template #thead-top>
                        <b-tr>
                            <b-th colspan="2" class="text-center">source</b-th>
                            <b-th class="text-center border-left border-right">relationship</b-th>
                            <b-th colspan="2" class="text-center">target</b-th>                   
                        </b-tr>
                    </template>                   
                    
                    <template #cell(sourceLabel)="row">
                        <NodeIconLink :nodeID="row.item.source"/>                        
                    </template>
                    <template #cell(targetLabel)="row">
                        <NodeIconLink :nodeID="row.item.target"/>
                    </template>
                    <template #cell(sourceDates)="row">
                        <YearRangeDisplay 
                            :minYear="row.item.sourceDates.minYear" 
                            :maxYear=" row.item.sourceDates.maxYear" 
                            :showDuration="true"/>                        
                    </template> 
                    <template #cell(targetDates)="row">
                        <YearRangeDisplay 
                            :minYear="row.item.targetDates.minYear" 
                            :maxYear=" row.item.targetDates.maxYear" 
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
import { NodeClass, isValidRange, rangeRelationship } from '@/composables/PhaserCommon'
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
				key: 'relationship',
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

        const selectedPhaseLabel = computed(() => store.getters.labelByID(props.phaseID))
        
        const phaseID = computed(() => props.phaseID)
        watch(phaseID, async (newValue) =>  { 
            isBusy.value = true
            items.value = [] 
            filterCount.value = 0           
            items.value = await getATRforPhase(newValue)
            filterCount.value = items.value.length             
            isBusy.value = false
        })   

        const getATRforPhase = async phaseID => {
            const atr = []
            
            // ensure its a valid phase ID before proceeding
            let phase = store.getters.nodeByID(phaseID)
            if(!phase) return atr

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
                let sourceLabel = store.getters.labelByID(sourceID, false) // can get from node now?
                let sourceClass = store.getters.classByID(sourceID)
                dates.forEach((targetDates, targetID) => {
                    let targetClass = store.getters.classByID(targetID)
                    if(sourceID !== targetID) {
                        atr.push({ 
                            source: sourceID, 
                            target: targetID, 
                            sourceClass: sourceClass,
                            targetClass: targetClass,
                            sourceLabel: sourceLabel,
                            targetLabel: store.getters.labelByID(targetID, false), // can get from node now?
                            sourceDates: sourceDates,
                            targetDates: targetDates,
                            relationship: rangeRelationship(sourceDates, targetDates) 
                        })
                    }
                })                    
            })

            return atr
        }

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
            isBusy 
        }
	}
}
</script>