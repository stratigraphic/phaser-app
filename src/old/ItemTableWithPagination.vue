<template>
    <b-container fluid class="p-0">
		<b-row align-h="between">			
			<b-col>
				<b-button pill
					v-if="itemClass !== 'edge'"
					size="sm"
					variant="outline-primary"
					class="text-left shadow" 
					:title="`add ${itemClass}`" 
					:alt="`add ${itemClass}`"			
					@click.stop="insertItem()">
					<b-icon-plus />Add {{ itemClass }}</b-button>
			</b-col>
			<b-col>
				<b-form-group
					label="Filter"
					label-for="filter-input"
					label-cols-sm="3"
					label-align-sm="right"
					label-size="sm"
					class="mb-2">
					<template v-slot:label>
						<b-icon-search />
					</template>
					<b-form-input 
						size="md"
						id="filter-input"
						class="shadow-sm"
						v-model="filter"
						type="search"
						autocomplete="off"
						:placeholder="`filter ${itemClass} records`"/>					
				</b-form-group>
			</b-col>
		</b-row>
		<b-row>
			<b-col>
				<b-table show-empty style="height: 250px;"
					:id="`datatable-${itemClass}`"
					sort-icon-left
					hover outlined selectable small 
					:per-page="perPage"
					:current-page="currentPage"
					:no-border-collapse="true"
					sticky-header="300px" 
					select-mode="single"
					primary-key="data.id"
					:items="items" 
					:fields="fields"
					:filter="filter"
					class="overflow-auto shadow-sm"
					@row-selected="rowSelected">
					<template #cell(actions)="row">
						<div class="text-right">
							<b-icon-x-circle width="15" height="15"
								class="action mr-2" 
								:title="`delete ${itemClass} ${row.item.data.label}`" 
								:alt="`delete ${itemClass}`"							
								@click.stop="deleteItem(row.item)"/>		
						</div>				
					</template>
					<template #cell(source)="row">
						<a href="#" @click="store.dispatch('setSelectedID', row.item.data.source)">{{ store.getters.labelByID(row.item.data.source, true) }}</a>
					</template>	
					<template #cell(target)="row">
						<a href="#" @click="store.dispatch('setSelectedID', row.item.data.target)">{{ store.getters.labelByID(row.item.data.target, true) }}</a>
					</template>	
					<template #cell(parent)="row">
						<a href="#" @click="store.dispatch('setSelectedID', row.item.data.parent)">{{ store.getters.labelByID(row.item.data.parent, true) }}</a>
					</template>	
					<template #cell(included)="row">
						<span :class="row.item.data.included ? 'text-success' : 'text-danger'">{{ row.item.data.included ? "✓" : "✗" }}</span>
					</template>				
				</b-table>
				<!--<div class="text-right">
					<b-icon-plus-circle
						class="action mr-2" 
						:title="`add ${itemClass}`" 
						:alt="`add ${itemClass}`"			
						@click.stop="createItem()"/>			
				</div>-->
			</b-col>
		</b-row>
		<b-row>
			<b-col>
				<b-pagination
					v-model="currentPage"
					:total-rows="rowCount"
					:per-page="perPage"
					aria-controls="my-table"
					:first-number="true"
					:last-number="true"/>
					<!--<p class="mt-3">Current Page: {{ currentPage }}</p>-->
			</b-col>
		</b-row>
	</b-container>
</template>

<script>
import { ref, computed, watch, inject } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass, EdgeClass } from '@/composables/PhaserCommon'

export default {
	props: {		
		itemClass: {
			type: String,
			required: false,
			default: NodeClass.PHASE,
			validator: value => [...Object.values(NodeClass), ...Object.values(EdgeClass)].includes(value)
		}
	},
	setup(props, context) {
		const store = inject('store')
		const filter = ref("")
		const sortBy = ref("data.label")
		const sortDesc = ref(false)
		const perPage = 25
		const currentPage = ref(1)

		// select row if node is selected somewhere else in the app (e.g. on the diagram)
		const selectedID = computed(() => store.getters.selectedID)
        watch(selectedID, (newValue) => {			
			// scroll to ensure selected row is visible in the table
			let el = document.getElementById(`datatable-${props.itemClass}__row_${newValue}`)			
			if(el) { 
				el.click() // simulates a click on the row to highlight
				el.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"}) // scroll the selected row 
				el.scrollIntoViewIfNeeded(true)
				// (TODO: should only do this if manually clicked?)
			}
        })
 
		const items = computed(() => {
			switch(props.itemClass) {
				case NodeClass.PHASE: return store.getters.phases
				case NodeClass.GROUP: return store.getters.groups
				case NodeClass.SUBGROUP: return store.getters.subgroups
				case NodeClass.CONTEXT: return store.getters.contexts
				case NodeClass.DATING: return store.getters.datings
				case NodeClass.PERIOD: return store.getters.periods
				case EdgeClass.EDGE: return store.getters.edges
				default: return []
			}
		})


		const rowCount = computed(() => items.value.length)

		const columns = computed(() => { 
			switch(props.itemClass) {
				case NodeClass.PHASE: return ["label", "enteredMinYear", "enteredMaxYear", "enteredDiff", "derivedMinYear", "derivedMaxYear", "duration", "period"]
				case NodeClass.GROUP: return ["label", "type", "parent", "derivedMinYear", "derivedMaxYear", "duration", "period"]
				case NodeClass.SUBGROUP: return ["label", "type", "parent", "derivedMinYear", "derivedMaxYear", "duration", "period"]
				case NodeClass.CONTEXT: return ["label", "type", "parent", "derivedMinYear", "derivedMaxYear", "duration", "period"]	
				case NodeClass.DATING: return ["label", "type", "parent", "enteredMinYear", "enteredMaxYear", "enteredDiff", "included", "period"]
				case NodeClass.PERIOD: return ["label", "enteredMinYear", "enteredMaxYear", "enteredDiff"]
				case EdgeClass.EDGE: return ["source", "type", "target", "derivedMinDuration", "derivedMaxDuration"]
				default: return []				
			}			
		})

		const fields = computed(() => {
			return [			
				// displaying label as if identifier
				... (columns.value.includes('label')) ? [{
					key: "data.label",
					label: "id",
					sortable: true					
				}] : [],
				... (columns.value.includes('period')) ? [{
					// virtual column with custom formatter
					key: 'period',
					label: 'period',
					sortByFormatted: true,
					formatter: tablePeriodFormatter,
					sortable: true					
				}] : [],
				/*... (columns.value.includes('source')) ? [{
					key: "data.source",
					label: "source",
					sortByFormatted: true,
					formatter: tableSourceIdFormatter,
					sortable: true					
				}] : [], */
				... (columns.value.includes('source')) ? [{
					key: "source",
					label: "source",
					sortByFormatted: true,
					//formatter: tableSourceIdFormatter,
					sortable: true					
				}] : [],  
				... (columns.value.includes('type')) ? [{
					key: "data.type",
					label: "type",
					sortable: true					
				}] : [],  
				... (columns.value.includes('target')) ? [{
					key: "target",
					label: "target",
					sortByFormatted: true,
					//formatter: tableTargetIdFormatter,
					sortable: true					
				}] : [],   
				... (columns.value.includes('parent')) ? [{
					key: "parent",
					label: "within",
					sortByFormatted: true,
					//formatter: tableParentFormatter,
					sortable: true					
                }] : [],                
				... (columns.value.includes('enteredMinYear')) ? [{
					// virtual column with custom formatter
					key: 'minyear',
					label: 'entered min year',
					sortByFormatted: true,
					formatter: tableMinYearFormatter,
					sortable: true,
					class: "text-right"
				}] : [],
				... (columns.value.includes('enteredMaxYear')) ? [{
					// virtual column with custom formatter
					key: 'maxyear',
					label: 'entered max year',
					sortByFormatted: true,
					formatter: tableMaxYearFormatter,
					sortable: true,
					class: "text-right"
					}] : [],
				... (columns.value.includes('enteredDiff')) ? [{
					// virtual column with custom formatter
					key: 'entereddiff',
					label: 'duration',
					sortByFormatted: true,
					formatter: enteredDiffFormatter,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (columns.value.includes('derivedMinYear')) ? [{
					// virtual column with custom formatter
					key: 'derivedminyear',
					label: 'derived min year',
					sortByFormatted: true,
					formatter: derivedMinYearFormatter,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (columns.value.includes('derivedMaxYear')) ? [{
					// virtual column with custom formatter
					key: 'derivedmaxyear',
					label: 'derived max year',
					sortByFormatted: true,
					formatter: derivedMaxYearFormatter,
					sortable: true,
					class: "text-right"
				}] : [],
				... (columns.value.includes('duration')) ? [{
					// virtual column with custom formatter
					key: 'duration',
					label: 'duration',
					sortByFormatted: true,
					formatter: durationFormatter,
					sortable: true,
					class: "text-right"
				}] : [],
				... (columns.value.includes('derivedMinDuration')) ? [{
					// virtual column with custom formatter
					key: 'derivedminduration',
					label: 'min duration',
					sortByFormatted: true,
					formatter: derivedMinDurationFormatter,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (columns.value.includes('derivedMaxDuration')) ? [{
					// virtual column with custom formatter
					key: 'derivedmaxduration',
					label: 'max duration',
					sortByFormatted: true,
					formatter: derivedMaxDurationFormatter,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (columns.value.includes('included')) ? [{
						key: "included",
						label: "included",	
						//formatter: value => value ? "✓" : "✗",				
						sortable: true,
						class: "text-center"				
				}] : [],     
				/*{
					key: "data.dating.minYear",
					label: "min year",
					sortable: true
				},
				{
					key: "data.dating.maxYear",
					label: "max year",
					sortable: true
				},*/
				{ 	
					key: "actions", 
					label: ""
				}
			]		
		})

		const insertItem = () => {
			switch(props.itemClass) {
				case NodeClass.PHASE: 
					store.dispatch('insertPhase'); break;
				case NodeClass.GROUP: 
					store.dispatch('insertGroup'); break;
				case NodeClass.SUBGROUP: 
					store.dispatch('insertSubGroup'); break;
				case NodeClass.CONTEXT: 
					store.dispatch('insertContext'); break;
				case NodeClass.DATING: 
					store.dispatch('insertDating'); break;	
				case NodeClass.PERIOD: 
					store.dispatch('insertPeriod'); break;				
			}
		}

		const updateItem = (item) => {
			if(item) {
				if(props.itemClass == EdgeClass.EDGE)
					store.dispatch('updateEdge', item)
				else
					store.dispatch('updateNode', item)
			}
		}

		const deleteItem = (item) => {
			const msg = `Delete ${ props.itemClass } "${item.data.label}" - are you sure?`
			context.root.$bvModal.msgBoxConfirm(msg)	// TODO: context.root is deprecated						
				.then(value => { 
					if(value) { 
						context.emit('item-deleted', item.data.id)
						if(props.itemClass == EdgeClass.EDGE)
							store.dispatch('deleteEdge', item)
						else
							store.dispatch('deleteNode', item)
					}
				})		
		}

		const rowSelected = (items) => {
			if(items.length > 0) {
				context.emit('item-selected', items[0])				
			}	
		}

		// table formatters to display node labels instead of IDs
		//const tableSourceIdFormatter = (value, key, item) => store.getters.labelByID(item.data.source, true)		
		//const tableTargetIdFormatter = (value, key, item) => store.getters.labelByID(item.data.target, true)
		//const tableParentFormatter = (value, key, item) => store.getters.labelByID(item.data.parent, true) 	
		const tablePeriodFormatter = (value, key, item) => store.getters.labelByID(item.data.period, false)

		// table formatters for years
		const tableYearFormat = (year, tolv, tolu) => {
            if(year == null || year == "")
				return ""
			else if(tolv == 0)
				return Number(year) //`${year}`
			else
				return `${year}±${tolv}${tolu == "years" ? "y" : "%"}`
        }
		const tableMinYearFormatter = (value, key, item) => {
			let dating = item.data?.dating || {}
            let year = dating.minYear
            let tolv = dating.minYearTolValue 						
            let tolu = dating.minYearTolUnit
            return tableYearFormat(year, tolv, tolu)
        }
        const tableMaxYearFormatter = (value, key, item) => {
			let dating = item.data?.dating || {}
            let year = dating.maxYear
            let tolv = dating.maxYearTolValue 						
            let tolu = dating.maxYearTolUnit
            return tableYearFormat(year, tolv, tolu)
        }
        
		const derivedMinYearFormatter = (value, key, item) => store.getters.derivedDates(item.data.id).minYear 		
		const derivedMaxYearFormatter = (value, key, item) => store.getters.derivedDates(item.data.id).maxYear 		
		const durationFormatter = (value, key, item) => store.getters.derivedDuration(item.data.id) 		
		const enteredDiffFormatter = (value, key, item) => store.getters.enteredDuration(item.data.id) 

		const derivedMinDurationFormatter = (value, key, item) => store.getters.derivedMinDuration(item.data.id) 	
		const derivedMaxDurationFormatter = (value, key, item) => store.getters.derivedMaxDuration(item.data.id) 	
			
		return {
			store,			
			filter,
			//selectedID,
			sortBy,
			sortDesc,
			items,
			columns,
			fields,
			perPage,
			currentPage,
			rowCount,
			insertItem,
			updateItem,
			deleteItem,
			rowSelected,
			//tableSourceIdFormatter,
			//tableTargetIdFormatter,
			//tableParentFormatter,
			tablePeriodFormatter,
			tableMinYearFormatter,
			tableMaxYearFormatter,
			derivedMinYearFormatter,
			derivedMaxYearFormatter,
			derivedMinDurationFormatter,
			derivedMaxDurationFormatter,
			durationFormatter,
			enteredDiffFormatter
		}
	}
} 
</script>
<style scoped>
.action { 
	cursor: pointer;
	color:dodgerblue;
}
a:hover {
	color:red;
}
.action:hover {
	color:red;
}
</style>

