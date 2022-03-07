<template>
<div>
    <b-form-group label="Target context">	
		<ItemLookup
			label="Meets"
			:disabled="disabled" 
			:optionNone="false"					
			:options="options"
			placeholder="meets phase"
			v-model="selectedTargetID"
			@change="targetChanged"/>
	</b-form-group>	
</div>
</template>

<script>
import { ref, computed, inject } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import ItemLookup from '@/components/ItemLookup'

export default {
	components: { ItemLookup },
    props: {
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		sourceID: {
			type: String,
			required: false,
			default: ""
		}
    },
    // not used yet... for specifying "phase meets" relationships
    setup(props) {
		const store = inject('store')
		const selectedTargetID = ref("")
        const current = computed(() => {
            const all = store.getters
                .edgesBySource(props.sourceID)
                .filter(e => e.data.type = "meets")
            if(all.length > 0)
                return all[0]
            else
                return null
        }) 
		const options = computed(() => store.getters.phases
            .filter(p => p.data.id !== props.sourceID)
            .map(p => { return { value: p.data.id, text: `(${p.data.class}) ${p.data.label}` }}))
            .sort((a, b) => a.text > b.text ? 1 : -1)
        //const available = computed(() => [])

        const addItem = () => {
			let edge = { 
				data: { 
					source: props.sourceID, 
					target: selectedTargetID.value,
					type: "meets"
				} 
			}
			store.dispatch('insertEdge', edge)
		}
		const removeItem = (item) => store.dispatch('deleteEdge', item)			
		const targetChanged = (value) => selectedTargetID.value = value

        return { selectedTargetID, options, targetChanged, current, addItem, removeItem }
    }
}
</script>