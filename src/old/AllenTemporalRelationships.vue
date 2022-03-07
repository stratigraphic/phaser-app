<template>
    <b-container fluid class="p-2">
        <b-overlay :show="isBusy" rounded="sm">  
            <div class="p-2 text-center">Temporal relationships from {{ elementLabel }} to other dated elements within the same phase:</div>	
            <b-table show-empty hover small sort-icon-left outlined    
                style="height: 300px;"
                id="datatable-temporal"
                :no-border-collapse="true"
                sticky-header="300px" 
                select-mode="single"
                :items="temporalRelationshipItems" 
                :fields="temporalRelationshipFields"
                class="overflow-auto shadow-sm"> 
                <template #cell(source)="row">
                    <span v-if="row.item.source == elementID">{{ store.getters.labelByID(row.item.source, true) }}</span>                   
                    <a v-else href="#" @click.stop="store.dispatch('setSelectedID', row.item.source)">{{ store.getters.labelByID(row.item.source, true) }}</a></template>           
                <template #cell(target)="row"> 
                    <span v-if="row.item.target == elementID">{{ store.getters.labelByID(row.item.target, true) }}</span>                   
                    <a v-else href="#" @click.stop="store.dispatch('setSelectedID', row.item.target)">{{ store.getters.labelByID(row.item.target, true) }}</a>
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

            <div class="p-2 text-center">Derived stratigraphic relationships from {{ elementLabel }} to other related elements within the same phase:</div>
            <b-table show-empty hover small sort-icon-left outlined    
                style="height: 300px;"
                id="datatable-temporal"
                :no-border-collapse="true"
                sticky-header="300px" 
                select-mode="single"
                :items="stratigraphicRelationshipItems" 
                :fields="stratigraphicRelationshipFields"
                class="overflow-auto shadow-sm"> 
                <template #cell(source)="row">
                    <span v-if="row.item.source == elementID">{{ store.getters.labelByID(row.item.source, true) }}</span>                   
                    <a v-else href="#" @click.stop="store.dispatch('setSelectedID', row.item.source)">{{ store.getters.labelByID(row.item.source, true) }}</a></template>           
                <template #cell(target)="row"> 
                    <span v-if="row.item.target == elementID">{{ store.getters.labelByID(row.item.target, true) }}</span>                   
                    <a v-else href="#" @click.stop="store.dispatch('setSelectedID', row.item.target)">{{ store.getters.labelByID(row.item.target, true) }}</a>
                </template>                           
            </b-table>
        </b-overlay> 
     </b-container>
</template>

<script>
import { ref, inject, computed, watch } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass, EdgeType, isPhase, isContext, isValidRange, rangeRelationship } from '@/composables/PhaserCommon'

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

        const temporalRelationshipItems = ref([])	
        const stratigraphicRelationshipItems = ref([])
        
        const elementLabel = computed(() => store.getters.labelByID(props.elementID, true))
        
        const temporalRelationshipFields = [ 
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

         const stratigraphicRelationshipFields = [ 
            {		
				key: 'source',
				label: 'source',                
				sortable: true					
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
			}     
        ]

        const currentID = computed(() => props.elementID)
        watch(currentID, async (newValue) => {
            // clear previous data and display busy indicator
            isBusy.value = true
            temporalRelationshipItems.value = []
            stratigraphicRelationshipItems.value = []

            // get allen temporal relationships
            let atrResponse = await getATR(newValue) 
            temporalRelationshipItems.value = atrResponse

            // get derived stratigraphic relationships
            let dsrResponse = await getDSR(newValue) 
            stratigraphicRelationshipItems.value = dsrResponse

            // clear busy indicator
            isBusy.value = false
        })       

        const getDSR = async id => {
            let node = store.getters.nodeByID(id)
            let phase = store.getters.ancestorsOfNode(node).find(isPhase)
            if(phase) {          
                let dsrForPhase = await getDSRforPhase(phase.data?.id)
                return dsrForPhase.filter(item => item.source == id || item.target == id)
            }
            else return []
        }   

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

        const getDSRforPhase = async phaseID => {
            const dsr = []
            // get ancestry of each context within the phase
            const contextAncestry = new Map()
            store.getters
                .descendantsOfID(phaseID)
                .filter(isContext)  
                .forEach(context => {
                    const ancestors = store.getters
                        .ancestorsOfNode(context)   // elements hierarchically containing this context
                        .map(node => node.data.id)  // we will only need the identifiers
                        .concat(context.data.id)    // add ID of this context because not in ancestors 
                    contextAncestry.set(context.data.id, ancestors)
                })
            
            // for all edges connecting contexts WITHIN the phase..
            store.getters.edges
                .filter(edge => contextAncestry.has(edge.data.source) && contextAncestry.has(edge.data.target)) 
                .filter(edge => edge.data.type === "above")            
                .forEach(edge => {

                // get ancestry of source and target contexts               
                let sourceAncestry = new Set(contextAncestry.get(edge.data.source))
                let targetAncestry = new Set(contextAncestry.get(edge.data.target))
                
                // remove any IDs the 2 sets have in common
                sourceAncestry.forEach(id => {
                    if(targetAncestry.has(id)) {
                        sourceAncestry.delete(id)
                        targetAncestry.delete(id)
                    }
                })               

                // all IDs in the source list are ABOVE all elements in the target list
                sourceAncestry.forEach(sourceID => {
                    targetAncestry.forEach(targetID => {
                        dsr.push({ 
                            source: sourceID, 
                            target: targetID, 
                            rel: EdgeType.ABOVE
                        })
                        dsr.push({ 
                            source: targetID, 
                            target: sourceID, 
                            rel: EdgeType.BELOW
                        })
                    })
                })
            })
            
            return dsr
        }

        /*
        // get array of derived stratigraphic relationships (DSR) from specified 
        // element (id) to any other elements contained within the same phase
        const getDSRold = async id => {
            const dsr = new Map()

            // if node not found then return empty array
            let node = store.getters.nodeByID(id)
            if(!node) return []

            // get phase this node is contained within         
            let phase = store.getters.ancestorsOfNode(node).find(isPhase)            
            // if not phased then return empty array
            if(!phase) return []
            let phaseDescendants = store.getters.descendantsOfID(phase.data.id).map(node => node.data.id)

            let elementAncestors = store.getters.ancestorsOfID(id).map(node => node.data.id)

            store.getters.edgesBySource(id)
                .filter(edge => edge.data.type === "above") // only 'above' relationships               
                .filter(edge => phaseDescendants.includes(edge.data.target)) // target is within the same phase
                .forEach(edge => {
                    let ancestors = store.getters
                        .ancestorsOfID(edge.data.target)
                        .map(node => node.data.id)
                        .concat(edge.data.target)
                        .filter(identifier => !elementAncestors.includes(identifier))
                    
                    ancestors.forEach(targetID => {
                        if(!dsr.has(targetID)) {
                            dsr.set(targetID, {
                                source: id, 
                                target: targetID, 
                                rel: "above"
                            })
                        }                   
                       
                    })
                })

             store.getters.edgesByTarget(id)
                .filter(edge => edge.data.type === "above") 
                .filter(edge => phaseDescendants.includes(edge.data.source)) // source is within the same phase
                .forEach(edge => {
                    let ancestors = store.getters
                        .ancestorsOfID(edge.data.source)
                        .map(node => node.data.id)
                        .concat(edge.data.source)
                        .filter(identifier => !elementAncestors.includes(identifier))
                    
                    ancestors.forEach(sourceID => {
                        if(!dsr.has(sourceID)) {
                            dsr.set(sourceID, {
                                source: id, 
                                target: sourceID, 
                                rel: EdgeType.BELOW
                            })
                        }   
                    })
                })       

            // return dsr items as array
            return [...dsr.values()]
        }*/

		return { 
            store, 
            isBusy, 
            temporalRelationshipFields, 
            temporalRelationshipItems, 
            stratigraphicRelationshipFields, 
            stratigraphicRelationshipItems, 
            elementLabel 
        }
	}
}
</script>
