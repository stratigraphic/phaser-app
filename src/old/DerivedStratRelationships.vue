<template>
    <b-container fluid class="p-2">
        <b-overlay :show="isBusy" rounded="sm">  
            <div class="p-2 text-center">Stratigraphic relationships from {{ elementLabel }} to elements within the same phase</div>	
            <b-table show-empty hover small sort-icon-left outlined    
                style="height: 500px;"
                id="datatable-temporal"
                :no-border-collapse="true"
                sticky-header="500px" 
                select-mode="single"
                :items="temporalRelationships" 
                :fields="fields"
                class="overflow-auto shadow-sm"> 
                <template #cell(source)="row">{{ store.getters.labelByID(row.item.source, true) }}</template>           
                <template #cell(target)="row">                    
                    <a href="#" @click.stop="store.dispatch('setSelectedID', row.item.target)">{{ store.getters.labelByID(row.item.target, true) }}</a>
                </template>    
                <template #cell(sourceDates)="row">
                    <span>(</span>
                    <span>{{ row.item.sourceDates.minYear }}</span>
                    <b-icon-arrow-right-short/>
                    <span>{{ row.item.sourceDates.maxYear }}</span>
                    <span>)</span>
                </template> 
                <template #cell(targetDates)="row">
                    <span>(</span>
                    <span>{{ row.item.targetDates.minYear }}</span>
                    <b-icon-arrow-right-short/>
                    <span>{{ row.item.targetDates.maxYear }}</span>
                    <span>)</span> 
                </template>            
            </b-table>
        </b-overlay> 
     </b-container>
</template>

<script>
import { ref, inject, computed, watch } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass, EdgeType, isPhase, isValidRange, rangeRelationship } from '@/composables/PhaserCommon'

export default {
    props: {        
		disabled: {
            type: Boolean,
            required: false,
            default: false
        },
        elementID: {
            type: String,
            required: false,
            default: ""
        }
	},
    setup(props) {
        const store = inject('store')
		const isBusy = ref(false)

        const temporalRelationships = ref([])	
        const stratigraphicRelationships = ref([])
       
        const elementLabel = computed(() => store.getters.labelByID(props.elementID, true))
        
        const fields = [ 
            {		
				key: 'source',
				label: 'source',                
				sortable: false					
			}, 
            {		
				key: 'sourceDates',
				label: '',                
				sortable: false					
			},                     
            {		
				key: 'rel',
				label: 'relationship',
				sortable: true					
			}, 			
            {		
				key: 'target',
				label: 'target',                
				sortable: true					
			},
            {		
				key: 'targetDates',
				label: '',                
				sortable: false					
			},      
        ]


        const currentID = computed(() => props.elementID)
        watch(currentID, async (newValue) => {
            // clear previous data and display busy indicator
            isBusy.value = true
            temporalRelationships.value = []
            stratigraphicRelationships.value = []

            // get allen temporal relationships
            let atrResponse = await getATR(newValue) 
            temporalRelationships.value = atrResponse

            // get derived stratigraphic relationships
            let dsrResponse = await getDSR(newValue) 
            stratigraphicRelationships.value = dsrResponse

            // clear busy indicator
            isBusy.value = false
        })
                
        // Get Allen Temporal Relationships (ATRs) from specified element (id) 
        // to any other dated elements contained within the same phase
        const getATR = async id => {
            const atr = []
            
            // if not a valid node then return empty array
            let node = store.getters.nodeByID(id)
            if(!node) return atr

            // get the phase this node is contained within (or it IS a phase...)
            let phase = null 
            if(isPhase(node))
                phase = node
            else
                phase = store.getters.ancestorsOfNode(node).find(isPhase)
            // if no phase then return empty array
            if(!phase) return atr

            // get all other groups, subgroups or contexts within the same Phase            
            let items = store.getters.descendantsOfID(phase.data.id)
                .filter(n => n.data.id !== id) // dont compare this node to itself!
                .filter(n => [NodeClass.GROUP, NodeClass.SUBGROUP, NodeClass.CONTEXT].includes(n.data.class))
                //.filter(n => isValidRange(n.data.dating))
            
            // compare other elements' derived dates to this element's derived dates
            // (only considering items with valid derived dates)
            const sourceDates = store.getters.derivedNodeDates(id)                   
            if(isValidRange(sourceDates)) {   
                items.forEach(item => {
                    const targetDates = store.getters.derivedNodeDates(item.data.id)
                    if(isValidRange(targetDates)) {                        
                        let rel = rangeRelationship(sourceDates, targetDates)
                        atr.push({ 
                            source: node.data.id, 
                            sourceDates: sourceDates,
                            target: item.data.id, 
                            targetDates: targetDates,
                            rel: rel
                        })
                    }
                })
            }
            return atr
        }

        // get array of derived stratigraphic relationships (DSR) from specified 
        // element (id) to any other elements contained within the same phase
        const getDSR = async id => {
            const dsr = new Map()

            // if node not found then return empty array
            let node = store.getters.nodeByID(id)
            if(!node) return []

            // get phase this node is contained within         
            let phase = store.getters.ancestorsOfNode(node).find(isPhase)            
            // if not phased then return empty array
            if(!phase) return []

            let phaseDescendants = store.getters
                .descendantsOfID(phase.data.id)
                .map(node => node.data.id)
            
            // get ancestry of the specified element (as a set of nodes)
            let sourceAncestry = new Set(store.getters.ancestorsOfID(id).map(node => node.data.id))
            // add specified element ID (because not included in ancestry)
            sourceAncestry.add(id)    
            
            // get ancestry of each target element (as sets of IDs)  TODO: check target is within the same phase              
            store.getters.edgesBySource(id)
                .filter(edge => phaseDescendants.includes(edge.data.target)) // target is within the same phase
                .filter(edge => edge.data.type === EdgeType.ABOVE) // only 'above' relationships (for now..)
                .forEach(edge => {
                    let targetAncestry = new Set(store.getters.ancestorsOfID(edge.data.target).map(node => node.data.id))
                    // add target node ID (because not included in ancestry)      
                    targetAncestry.add(edge.data.target)

                    // remove any IDs the 2 sets have in common
                    sourceAncestry.forEach(id => {
                        if(targetAncestry.has(id)) {
                            sourceAncestry.delete(id)
                            targetAncestry.delete(id)
                        }
                    })

                    // generate links - all elements in sourceAncestry 
                    // are 'above' all elements in targetAncestry 
                    sourceAncestry.forEach(sourceID => {
                        targetAncestry.forEach(targetID => {
                            if(!dsr.has(targetID)) {
                                dsr.set(targetID, {
                                    id: targetID, 
                                    source: sourceID, 
                                    target: targetID, 
                                    type: EdgeType.ABOVE
                                })
                            }                   
                        })
                    })
                })

            // return dsr items as array
            return [...dsr.values()]
        }

		return { store, isBusy, fields, temporalRelationships, stratigraphicRelationships, elementLabel }
	}
}
</script>
