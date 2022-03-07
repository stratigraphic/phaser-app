<template>
	<b-container fluid class="p-2">
		<ItemTable
			:selectedID="selectedID"
			:itemClass="itemClass" 
			class="mb-2" 
			@item-selected="itemSelected" 
			@item-deleted="itemDeleted"/>
					
		<!--<b-form-row v-if="fields.includes('redolayout')">		
			<b-col style="text-align: right">
				<b-button pill
					size="sm"
					:disabled="disabled || store.getters.diagramLock" 
					variant="primary"
					class="text-left shadow" 
					title="redo layout" 
					alt="redo layout"			
					@click.stop="redoCompoundNodeLayout">
					<b-icon-diagram-3 class="mr-2" />
					<span>{{`Redo layout for this ${itemClass}`}}</span>
				</b-button>
			</b-col>			
		</b-form-row>-->

		<b-form-row v-if="fields.includes('connectedElements')">
			<b-col>
				<ConnectedElements :contextID="((selectedItem || {}).data || {}).id"/>
			</b-col>
		</b-form-row>
			
		<b-form-row>
			<b-col>
				<ItemLabel v-if="fields.includes('label')"
					:disabled="disabled" 
					label="Identifier"
					:placeholder="`${itemClass}`" 
					v-model.lazy="((selectedItem || {}).data || {}).label" 
					@input="labelChanged"/>
			</b-col>			
			<b-col>
				<div style="text-align: right" v-if="fields.includes('redolayout')">
					<b-button pill
						size="sm"
						:disabled="disabled || store.getters.diagramLock" 
						variant="primary"
						class="text-left shadow" 
						title="redo layout" 
						alt="redo layout"			
						@click.stop="redoCompoundNodeLayout">
						<b-icon-diagram-3 class="mr-2" />
						<span>{{`Redo layout for this ${itemClass}`}}</span>
					</b-button>					
				</div>
				<ItemLabel v-if="fields.includes('uri')" 
					:disabled="disabled" 
					label="URI"
					:placeholder="`${itemClass}`" 
					v-model.lazy="((selectedItem || {}).data || {}).uri" 
					@input="uriChanged"/>	
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col>				
				<ItemLookup2 v-if="fields.includes('period')"
					label="Period" 
					:disabled="disabled"
					placeholder="period" 
					v-model="((selectedItem || {}).data || {}).period"  
					:options="periodLookupOptions" 
					@change="periodChanged"/>
			</b-col>

			<b-col>
				<ItemLookup2 v-if="fields.includes('parent')"
					label="Within" 
					:disabled="disabled"
					:placeholder="`${itemClass} parent`" 
					v-model="((selectedItem || {}).data || {}).parent"  
					:options="parentLookupOptions" 
					@change="parentChanged"/>	

				<!--<ItemList v-if="fields.includes('contains')"	 			
					label="Contains" 
					:disabled="true" 
					:items="itemContains"/>-->
				
			</b-col>
		</b-form-row>
		<b-form-row>	
			<b-col>
				<ItemLookup v-if="fields.includes('type')"
						label="Type" 
						mode="input"
						:disabled="disabled" 
						:placeholder="`${itemClass} type`" 
						v-model="((selectedItem || {}).data || {}).type" 
						:options="typeLookupOptions"
						@change="typeChanged"/> 
			</b-col>
			<b-col>
				<ItemLookup v-if="fields.includes('cud')"
					label="Construction/Use/Disuse" 
					:disabled="disabled" 
					v-model="((selectedItem || {}).data || {}).cud"
					:options="[
						{ value: 'C', text: 'construction' }, 
						{ value: 'U', text: 'use' }, 
						{ value: 'D', text: 'disuse' },
						{ value: 'CU', text: 'construction &amp; use' }, 
						{ value: 'CD', text: 'construction &amp; disuse' },
						{ value: 'UD', text: 'use &amp; disuse' },
						{ value: 'CUD', text: 'construction &amp; use &amp; disuse' }
					]" 
					@change="cudChanged"/>				
			</b-col>				
		</b-form-row> 

		<b-form-row>
			<b-col v-if="fields.includes('contains')">
				<ItemContains 
					v-if="fields.includes('contains')" 
					:id="((selectedItem || {}).data || {}).id" 
					:disabled="disabled"/>
			</b-col>	
			<b-col v-if="fields.includes('description')" >	
				<b-form-group v-if="fields.includes('description')" 
					label="Description"				
					label-for="itemDescription">	
					<b-form-textarea 
						size="sm"
						style="resize: vertical;" 
						:disabled="disabled"
						class="shadow-sm" 
						:placeholder="`${itemClass} description`" 
						rows="5"
						max-rows="5"
						name="itemDescription" 
						v-model.trim="((selectedItem || {}).data || {}).description" 
						@change="descriptionChanged"/>
				</b-form-group>
			</b-col>
		</b-form-row>

		<b-form-row>	
			<b-col>						
				<DatingYearRangeCE v-if="fields.includes('yearrange')"  
					:disabled="disabled" 
					:dating="((selectedItem || {}).data || {}).dating"
					@change="datingChanged"/>
				<SciDating v-if="fields.includes('scidating')"  
					:disabled="disabled" 
					:dating="((selectedItem || {}).data || {}).dating"
					@change="datingChanged"/>
			</b-col>
		</b-form-row> 

		<b-form-row>
			<b-col>
				<b-form-checkbox v-if="fields.includes('included')" 
					:disabled="disabled" 
					v-model="((selectedItem || {}).data || {}).included" 
					:value="true"
					:unchecked-value="false" 
					name="check-button" 
					switch 
					@change="includeChanged">Included in calculations</b-form-checkbox>						
			</b-col>
			<b-col>
				<b-form-group v-if="fields.includes('association')"
					label="Association"				
					label-for="itemAssociation">
					<b-form-select 
						:disabled="this.disabled"
						v-model="((selectedItem || {}).data || {}).association"
						name="itemAssociation" 
						class="shadow-sm"                
						:options="[
							{ value: 'direct', text: 'direct' }, 
							{ value: 'residual', text: 'residual' }, 
							{ value: 'intrusive', text: 'intrusive' }, 
							{ value: 'other', text: 'other' }
						]" 
						@change="associationChanged"/>
				</b-form-group>
			</b-col>	
		</b-form-row>	

		<b-form-row v-if="fields.includes('stratigraphy')">	
			<b-col>
				<Stratigraphy/>
			</b-col>
		</b-form-row>
	
		
		<!--<b-form-row v-if="fields.includes('temporal')">
			<b-col>
				<TemporalRelationshipsTable 
					:elementID="((selectedItem || {}).data || {}).id"
					:disabled="disabled"/>
			</b-col>
		</b-form-row>-->
		
	</b-container>
</template>

<script>
import { ref, unref, computed, inject, onMounted } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
import _cloneDeep from "lodash/cloneDeep"
import _merge from "lodash/merge"
import { NodeClass, EdgeClass } from '@/composables/PhaserCommon'

import ItemTable from '@/components/ItemTable'
import ItemLookup from '@/components/ItemLookup'
import ItemLookup2 from '@/components/ItemLookup2'
import Stratigraphy from '@/components/Stratigraphy'
import DatingYearRangeCE from '@/components/DatingYearRangeCE'
import SciDating from '@/components/SciDating'
import ItemLabel from '@/components/ItemLabel'
import ItemContains from '@/components/ItemContains'
//import ItemList from '@/components/ItemList'
//import TemporalRelationshipsTable from "@/components/TemporalRelationshipsTable"
import ConnectedElements from '@/components/ConnectedElements'
import EventBus from "@/composables/EventBus"

export default {
	name: 'ItemEditor',
	components: {
		//ItemTable,
		ItemTable,
		ItemLookup,
		ItemLookup2,
		Stratigraphy,
		ConnectedElements,
		//DatingYearRange,
		DatingYearRangeCE,
		SciDating,
		ItemLabel,
		ItemContains,
		//ItemList,
		//TemporalRelationshipsTable
		
	},
	props: {
		selectedID: {
			type: String,
			required: false,
			default: ""
		},
		itemClass: {
			type: String,
			required: false,
			default: NodeClass.PHASE,
			validator: value => [...Object.values(NodeClass), ...Object.values(EdgeClass)].includes(value) 
		}
	},
	setup(props) {
		const store = inject('store')
		const selectedItem = ref(null)
		const disabled = computed(() => selectedItem.value === null || selectedItem.value === "")
		
		// This determines which editing controls are visible
		const fields = computed(() => { 
			switch(props.itemClass) {
				case NodeClass.PHASE: return ["label", "description", "contains", "yearrange", "redolayout", "period", "temporal"]
				case NodeClass.GROUP: return ["label", "type", "parent", "contains", "description", "redolayout", "cud", "period", "temporal"]
				case NodeClass.SUBGROUP: return ["label", "type", "parent", "contains", "description", "redolayout", "cud", "period", "temporal"]
				case NodeClass.CONTEXT: return ["label", "type", "parent", "contains", "description", "cud", "period", "temporal", "connectedElements"]	
				case NodeClass.DATING: return ["label", "type", "parent", "description", "scidating", "included", "association", "period"]
				case NodeClass.PERIOD: return ["label", "uri", "description", "contains", "yearrange"]
				case EdgeClass.EDGE: return ["stratigraphy"]
				default: return []
			}			
		})

		// options for use in lookups
		const periodLookupOptions = computed(() => store.getters.periodOptions)
		const phaseLookupOptions = computed(() => store.getters.phaseOptions)
		const parentLookupOptions = computed(() => { 
			switch(props.itemClass) {
				// phases wont have a parent
				case NodeClass.GROUP: return store.getters.phaseOptionsGrouped
				case NodeClass.SUBGROUP: return store.getters.groupOptionsGrouped
				case NodeClass.CONTEXT: return store.getters.contextParentOptions			
				case NodeClass.DATING: return store.getters.contextOptionsGrouped	
				default: return []
			}			
		})
		const typeLookupOptions = computed(() => { 
			switch(props.itemClass) {
				case NodeClass.PHASE: return store.getters.phaseTypeOptions
				case NodeClass.GROUP: return store.getters.groupTypeOptions
				case NodeClass.SUBGROUP: return store.getters.groupTypeOptions
				case NodeClass.CONTEXT: return store.getters.contextTypeOptions
				case NodeClass.DATING: return store.getters.datingTypeOptions
				default: return []
			}
		})	
		
		const itemSelected = (item) => {
            //selectedItem.value = item
			selectedItem.value = _merge({}, item)
			//console.log(selectedItem)
			//this.$store.dispatch('setSelectedID', ((this.selectedItem || {}).data || {}).id)
			store.dispatch('setSelectedID', unref(selectedItem).data?.id)
        }

		const itemDeleted = (id) => {
			// if it was the selectedItem set that to null
			if(selectedItem.value) {
				if(selectedItem.value.data?.id == id)
					selectedItem.value = null
			}
		}

		const labelChanged = () => itemChanged()
		const uriChanged = () => itemChanged()
		const descriptionChanged = () => itemChanged()
		
		const redoCompoundNodeLayout = () => {
			// comunicate this to cytoscape diagram via event bus
			if(selectedItem.value) {
				EventBus.$emit('diagram-redo-compound-layout', unref(selectedItem))
			}
		}

		const parentChanged = (value) => {
			if(selectedItem.value) {
				// new parent group for context chosen
				if(selectedItem.value.data.parent != value) {
					selectedItem.value.data.parent = value
					// comunicate this change to cytoscape diagram via event bus
					EventBus.$emit('node-parent-changed', unref(selectedItem)) 
					// also flag the change to parent control
					itemChanged()
				}	
			}
		}

		const typeChanged = (value) => {
			if(selectedItem.value) {
				selectedItem.value.data.type = value
				itemChanged()
			}
		}

		const datingChanged = (dating) => {	
			if(selectedItem.value) {
				selectedItem.value.data.dating = dating
				itemChanged()
			}
		}

		const includeChanged = (value) => {	
			if(selectedItem.value) {
				selectedItem.value.data.included = value
				itemChanged()
			}
		}

		const associationChanged = (value) => {	
			if(selectedItem.value) {
				selectedItem.value.data.association = value
				itemChanged()
			}
		}

		const cudChanged = (value) => {	
			if(selectedItem.value) {
				selectedItem.value.data.cud = value
				itemChanged()
			}
		}

		const periodChanged = (value) => {	
			if(selectedItem.value) {
				if(selectedItem.value.data.period) {
					selectedItem.value.data.period = value
					itemChanged()					
				}
			}
		}
		
		const itemChanged = () => {
            store.dispatch('updateNode', unref(selectedItem))
		}	     

		return { 
			store,
			selectedItem, 
			disabled, 
			fields, 
			parentLookupOptions,
			typeLookupOptions,
			phaseLookupOptions,
			periodLookupOptions,
			itemSelected,
			itemDeleted,
			labelChanged,
			uriChanged,
			descriptionChanged,
			redoCompoundNodeLayout,
			parentChanged,
			typeChanged,
			datingChanged,
			includeChanged,
			associationChanged,
			cudChanged,
			periodChanged,
			itemChanged
		}
	}
}
</script>
<style scoped>
a:hover {
	color:red;
}
</style>