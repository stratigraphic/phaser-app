<template>
    <div class="m-2">
		<ItemTable :itemClass="itemClass" class="mb-2" @itemSelected="itemSelected" @itemDeleted="itemDeleted"/>
		
		<b-form-row v-if="fields.includes('redolayout')">		
			<b-col style="text-align: right">
				<b-button pill
					size="sm"
					:disabled="disabled" 
					variant="outline-primary"
					class="text-left shadow" 
					title="redo layout" 
					alt="redo layout"			
					@click.stop="redoCompoundNodeLayout">
					<b-icon-diagram-3 class="mr-2" />
					<span>{{`Redo layout for this ${itemClass}`}}</span>
				</b-button>
			</b-col>			
		</b-form-row>
		<b-form-row>
			<!--<b-col>
				<b-form-group label="Identifier" label-for="itemID">	
					<b-form-input text 
						:disabled="true"
						class="shadow-sm" 
						:placeholder="`${itemClass} identifier`" 
						type="text"
						name="itemID" 
						:value="((selectedItem || {}).data || {}).id"/>						
				</b-form-group>
			</b-col>-->
			<b-col>
				<!--<b-form-group v-if="fields.includes('label')" 
					label="Identifier" 
					label-for="itemLabel">	
					<b-form-input text 
						:disabled="disabled"
						class="shadow-sm" 
						:placeholder="`${itemClass}`" 
						type="text"
						name="itemLabel"
						autocomplete="off" 
						v-model.trim="((selectedItem || {}).data || {}).label" 
						@change="labelChanged"/>
				</b-form-group>-->

				<ItemLabel v-if="fields.includes('label')" 
					:disabled="disabled" 
					:placeholder="`${itemClass}`" 
					v-model.lazy="((selectedItem || {}).data || {}).label" 
					@input="labelChanged"/>

				<ItemLabel v-if="fields.includes('uri')" 
					:disabled="disabled" 
					label="URI"
					:placeholder="`${itemClass}`" 
					v-model.lazy="((selectedItem || {}).data || {}).uri" 
					@input="uriChanged"/>

				<ItemLookup v-if="fields.includes('period')"
					label="Period" 
					:disabled="disabled"
					v-model="((selectedItem || {}).data || {}).period"  
					:options="$store.getters.periodOptions" 
					@change="periodChanged"/>
			
				<ItemLookup v-if="fields.includes('type')"
					label="Type" 
					mode="input"
					:disabled="disabled" 
					:placeholder="`${itemClass} type`" 
					v-model="((selectedItem || {}).data || {}).type" 
					:options="typeLookupOptions"
					@change="typeChanged"/> 

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
			<b-col>
				<ItemLookup v-if="fields.includes('parent')"
					label="Within" 
					:disabled="disabled"
					class="shadow-sm"
					:placeholder="`${itemClass} parent`" 
					v-model="((selectedItem || {}).data || {}).parent"  
					:options="parentLookupOptions" 
					@change="parentChanged"/>	

				<ItemList v-if="fields.includes('contains')"	 			
					label="Contains" 
					:disabled="true" 
					:items="itemContains"/>

				<!--<b-form-group v-if="fields.includes('contains')" 
					label="Contains"				
					label-for="itemContains" size="sm">
					<b-list-group 
						class="shadow-sm overflow-auto m-1" 
						style="height: 175px;"   
						:disabled="true">
						<b-list-group-item v-for="(item, index) in itemContains" :key="index">{{item}}</b-list-group-item>
					</b-list-group>
				</b-form-group>	-->

				<!--<b-form-group v-if="fields.includes('containsGroups')" 
					label="Contains groups"				
					label-for="containsGroups">
					<b-form-input
						:disabled="true"
						class="shadow-sm"
						:value="containsGroups"/>
				</b-form-group>

				<b-form-group v-if="fields.includes('containsSubGroups')" 
					label="Contains subgroups"				
					label-for="containsSubGroups">
					<b-form-input
						:disabled="true"
						class="shadow-sm"
						:value="containsSubGroups"/>
				</b-form-group>

				<b-form-group v-if="fields.includes('containsContexts')" 
					label="Contains contexts"				
					label-for="containsContexts">
					<b-form-input
						:disabled="true"
						class="shadow-sm"
						:value="containsContexts"/>
				</b-form-group>	

				<b-form-group v-if="fields.includes('containsDatings')" 
					label="Contains datings"				
					label-for="containsDatings">
					<b-form-input
						:disabled="true"
						class="shadow-sm"
						:value="containsDatings"/>
				</b-form-group>	-->
				<ItemList v-if="fields.includes('periodContains')"	 			
					label="Contains" 
					:disabled="true" 
					:items="periodContains"/>

				<!--<b-form-group v-if="fields.includes('periodContains')" 
					label="Period contains"				
					label-for="periodContains">
					<b-form-input
						:disabled="true"
						class="shadow-sm"
						:value="nodesForPeriod"/>
				</b-form-group>-->	
			</b-col>
		</b-form-row> 

		<b-form-row>	
			<b-col>	
				<b-form-group v-if="fields.includes('description')" 
					label="Description"				
					label-for="itemDescription">	
					<b-form-textarea 
						:disabled="disabled"
						class="shadow-sm" 
						:placeholder="`${itemClass} description`" 
						rows="2"
						max-rows="2"
						name="itemDescription" 
						v-model.trim="((selectedItem || {}).data || {}).description" 
						@change="descriptionChanged"/>
				</b-form-group>
			</b-col>
		</b-form-row>

		<b-form-row>	
			<b-col>		
				<DatingYearRange v-if="fields.includes('yearrange')"  
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
			
		<b-form-row>	
			<b-col>
				<Stratigraphy v-if="fields.includes('stratigraphy')" 
					:sourceID="((selectedItem || {}).data || {}).id"
					:disabled="disabled"/>
			</b-col>
		</b-form-row>

		<!--<div>{{ `[x: ${(position || {}).x}, y: ${(position || {}).y}]`}}</div>-->
	</div>		
</template>

<script>
import {NodeClass} from '@/mixins/constants.js'
import ItemTable from '@/components/ItemTable'
import ItemLookup from '@/components/ItemLookup'
//import DatingYearRange from '@/components/DatingYearRange'
import Stratigraphy from '@/components/Stratigraphy'
import DatingYearRange from '@/components/DatingYearRange'
import SciDating from '@/components/SciDating'
import ItemLabel from '@/components/ItemLabel'
import ItemList from '@/components/ItemList'

export default {
	name: 'ItemEditor',
	components: {
		ItemTable,
		ItemLookup,
		//DatingYearRange,
		Stratigraphy,
		DatingYearRange,
		SciDating,
		ItemLabel,
		ItemList
		
	},
	mixins: [ ],
	props: {
		itemClass: {
			type: String,
			required: false,
			default: NodeClass.PHASE,
			validator: value => [...Object.values(NodeClass), "edge"].includes(value) 
		}
	},
	data() { 
        return { 
            selectedItem: null
        } 
    },
	computed: {
		disabled() { return this.selectedItem == null },
		position() { return this.selectedItem?.position },
		fields() { 
			switch(this.itemClass) {
				case NodeClass.PHASE: return ["label", "description", "contains", "containsGroups", "containsSubGroups", "containsContexts", "yearrange", "redolayout", "period"]
				case NodeClass.GROUP: return ["label", "type", "parent", "contains", "containsSubGroups", "containsContexts", "description", "redolayout", "cud", "period"]
				case NodeClass.SUBGROUP: return ["label", "type", "parent", "contains", "containsContexts", "description", "redolayout", "cud", "period"]
				case NodeClass.CONTEXT: return ["label", "type", "parent", "contains", "containsDatings", "description", "stratigraphy", "cud", "period"]	
				case NodeClass.DATING: return ["label", "type", "parent", "description", "scidating", "included", "association", "period"]
				case NodeClass.PERIOD: return ["label", "uri", "description", "periodContains", "yearrange"]
				default: return []
			}			
		},
		parentLookupOptions() { 
			switch(this.itemClass) {
				case NodeClass.GROUP: return this.$store.getters.phaseOptionsGrouped
				case NodeClass.SUBGROUP: return this.$store.getters.groupOptionsGrouped
				case NodeClass.CONTEXT: return this.$store.getters.contextParentOptions			
				case NodeClass.DATING: return this.$store.getters.contextOptionsGrouped	
				default: return []
			}			
		}, 
		typeLookupOptions() { 
			switch(this.itemClass) {
				case NodeClass.PHASE: return this.$store.getters.phaseTypeOptions
				case NodeClass.GROUP: return this.$store.getters.groupTypeOptions
				case NodeClass.SUBGROUP: return this.$store.getters.groupTypeOptions
				case NodeClass.CONTEXT: return this.$store.getters.contextTypeOptions
				case NodeClass.DATING: return this.$store.getters.datingTypeOptions
				default: return []
			}
		},
		itemContains() { 
			let id = this.selectedItem?.data?.id || ""
			if(id !== "")
				return this.$store.getters.descendantsOfID(id)
					.map(n => `(${n.data.class}) ${n.data.label}`)					
			else
				return [] 
		},
		periodContains(){
			let id = this.selectedItem?.data?.id
			if(id) {
				return this.$store.getters.nodes
					.filter(n => n.data.period == id)
					.map(n => `(${n.data.class}) ${n.data.label}`)
					//.sort((a,b) => a - b) // ensures numeric values still sorted correctly
					//.join(", ")
			}
			else
				return []
		},
		/*containsGroups() { 
			let id = this.selectedItem?.data?.id
			if(id) {
				return this.$store.getters.descendantsOfID(id)
					.filter(n => n.data.class == NodeClass.GROUP)
					.map(n => n.data.label)
					.sort((a,b) => a - b) // ensures numeric values still sorted correctly
					.join(", ")
			}
			else
				return "" 
		},
		containsSubGroups() { 
			let id = this.selectedItem?.data?.id
			if(id) {
				return this.$store.getters.descendantsOfID(id)
					.filter(n => n.data.class == NodeClass.SUBGROUP)
					.map(n => n.data.label)
					.sort((a,b) => a - b) // ensures numeric values still sorted correctly
					.join(", ")
			}
			else
				return "" 
		},
		containsContexts() { 
			let id = this.selectedItem?.data?.id
			if(id) {
				return this.$store.getters.descendantsOfID(id)
					.filter(n => n.data.class == NodeClass.CONTEXT)
					.map(n => n.data.label)
					.sort((a,b) => a - b) // ensures numeric values still sorted correctly
					.join(", ")
			}
			else
				return "" 
		},
		containsDatings() { 
			let id = this.selectedItem?.data?.id
			if(id) {
				return this.$store.getters.descendantsOfID(id)
					.filter(n => n.data.class == NodeClass.DATING)
					.map(n => n.data.label)
					.sort((a,b) => a - b) // ensures numeric values still sorted correctly
					.join(", ")
			}
			else
				return "" 
		}*/
	},
	methods: {
        itemSelected(item) {
            this.selectedItem = item
			//this.$store.dispatch('setSelectedID', ((this.selectedItem || {}).data || {}).id)
			this.$store.dispatch('setSelectedID', this.selectedItem?.data?.id)

        },
		itemDeleted(id) {
			//if(((this.selectedItem || {}).data || {}).id == id)
			if(this.selectedItem?.data?.id == id)
				this.selectedItem = null
		},
		labelChanged() {
			this.itemChanged()
		},
		uriChanged() {
			this.itemChanged()
		},
		descriptionChanged() {
			this.itemChanged()
		},
		/*phaseChanged(value) {
			if(this.selectedItem) {
				this.selectedItem.data.inphase = value
				this.changed()
			}
		},*/
		redoCompoundNodeLayout() {
			// comunicate this to cytoscape diagram via event bus
			if(this.selectedItem) {
				this.$root.$emit('redoCompoundNodeLayout', this.selectedItem)
			}
		},
		parentChanged(value) {
			if(this.selectedItem) {
				// new parent group for context chosen
				if(this.selectedItem.data.parent != value) {
					this.selectedItem.data.parent = value
					// comunicate this change to cytoscape diagram via event bus
					this.$root.$emit('nodeParentChanged', this.selectedItem) 
					// also flag the change to parent control
					this.itemChanged()
				}	
			}
		},		
		typeChanged(value) {
			if(this.selectedItem) {
				this.selectedItem.data.type = value
				this.itemChanged()
			}
		},
		datingChanged(dating) {	
			if(this.selectedItem) {
				this.selectedItem.data.dating = dating
				this.itemChanged()
			}
		},
		includeChanged(value) {	
			if(this.selectedItem) {
				this.selectedItem.data.included = value
				this.itemChanged()
			}
		},
		associationChanged(value) {	
			if(this.selectedItem) {
				this.selectedItem.data.association = value
				this.itemChanged()
			}
		},
		cudChanged(value) {	
			if(this.selectedItem) {
				this.selectedItem.data.cud = value
				this.itemChanged()
			}
		},
		periodChanged(value) {	
			if(this.selectedItem) {
				this.selectedItem.data.period = value
				this.itemChanged()
			}
		},
		itemChanged() {
            this.$store.dispatch('updateNode', this.selectedItem)
		},	        
    },
	// lifecycle hooks
	beforeCreate() {},
	created() {},
	beforeMount() {},
	mounted() {},
	beforeUpdate() {},
	updated() {},
	beforeDestroy() {},
	destroyed() {}
}
</script>

<style scoped>
</style>