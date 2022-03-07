<template>
<div>
    <b-form-group label="Stratigraphy" class="border m-0 p-1 shadow">		
		<b-form-row>
			<b-col>
				<b-form-group label="Source context">
					<vue-bootstrap-typeahead 
						size="sm"
						:disabled="disabled"
						:data="nodeOptions" 
						:serializer="item => item.text"
						:minMatchingChars="1"
						:maxMatches="5"
						v-model="sourceID"
						@hit="sourceSelected">						
					</vue-bootstrap-typeahead>
				</b-form-group>	
			</b-col>
			<b-col>	
				<b-form-group label="Relationship">	
					<b-form-select 
						size="sm"
						:disabled="disabled"
						name="edgeTypeSelector" 
						class="shadow-sm"                
						placeholder="relationship"
						v-model="edgeType"
						:options="edgeOptions"/>
				</b-form-group>					
			</b-col>
			<b-col>
				<b-form-group label="Target context">
					<vue-bootstrap-typeahead 
						size="sm"
						:data="nodeOptions"
						:serializer="item => item.text"
						:minMatchingChars="1"
						:maxMatches="5"
						v-model="targetID"							
						@hit="targetSelected"/>
				</b-form-group>									
			</b-col>
			<b-col>	</b-col>
		</b-form-row>
		<b-form-row>
			<b-col class="text-center">
				<NodeIconLink :nodeID="sourceID"/>
			</b-col>
			<b-col class="text-center">
				<span>{{ edgeType}}</span>							
			</b-col>
			<b-col class="text-center">
				<NodeIconLink :nodeID="targetID"/>
			</b-col>
			<b-col>
				<b-form-group>
					<b-button pill
						size="sm"
						:disabled="!addEnabled" 
						variant="primary"
						class="text-left shadow" 
						title="add" 
						alt="add"							
						@click.stop="addItem">
						<b-icon-plus />
						<span>Add relationship</span>
					</b-button>	
				</b-form-group>		
			</b-col>
		</b-form-row>		
	</b-form-group>
</div>
</template>

<script>
import { ref, unref, computed, inject } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import ItemLookup from '@/components/ItemLookup'
import NodeIconLink from '@/components/NodeIconLink'
import { EdgeType } from '@/composables/PhaserCommon'
import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'
// Don't forget to include the Bootstrap CSS/SCSS files!
//import 'bootstrap/scss/bootstrap.scss'

export default {
	components: { 
		ItemLookup, 
		VueBootstrapTypeahead, 
		NodeIconLink 
	},
	//mixins: [ PhaserCommon ],
	props: {
		disabled: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	setup(props) {
		const store = inject('store')		
		const sourceID = ref(null)
		const targetID = ref(null)
		const edgeType = ref(EdgeType.ABOVE)

		const addEnabled = computed(() => props.disabled == false 
			&& sourceID.value !== targetID.value 			
			&& store.getters.isNode(sourceID.value) 
			&& store.getters.isNode(targetID.value)
			&& Object.values(EdgeType).includes(edgeType.value) 			
		)
		
		const sourceSelected = (item) => { sourceID.value = item.value }
		const targetSelected = (item) => { targetID.value = item.value }
		
		const nodeOptions = computed(() => store.getters.contexts
        	.map(n => { return { value: n.data.id, text: n.data.label }})
        	.sort((a, b) => a.text > b.text ? 1 : -1))

		// don't allow creation of 'below' relationship, only 'ABOVE' or 'EQUAL'
		const edgeOptions = [EdgeType.ABOVE, EdgeType.EQUAL] //Object.values(EdgeType)
			.map(t => { return { value: t, text: t } })		
		
		const addItem = () => {
			let edge = store.getters.newEdge()
			edge.data.source = sourceID.value
			edge.data.target = targetID.value
			edge.data.type =  edgeType.value		
			store.dispatch('updateEdge', edge)			
		}		

		return {
			store,
			addEnabled,
			nodeOptions,
			edgeOptions, 
			addItem,
			sourceID,
			targetID, 
			edgeType,
			sourceSelected,
			targetSelected
		}
	}
}
</script>

<style scoped>
.action { 
	cursor: pointer;
	color:dodgerblue;
}
.action:hover {
	color:red;
}
</style>