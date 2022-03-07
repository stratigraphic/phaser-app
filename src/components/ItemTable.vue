<template>
    <b-container fluid class="p-0">
		<b-overlay :show="isBusy" rounded="sm">
		<b-row align-h="between">			
			<b-col>
				<b-button pill v-if="itemClass !== 'edge'"					
					size="sm"
					variant="primary"
					class="text-left shadow" 
					:title="`add ${itemClass}`" 
					:alt="`add ${itemClass}`"			
					@click.stop="insertItem()">
					<b-icon-plus />Add {{ itemClass }}</b-button>
				<b-button 
                    pill
                    size="sm"
                    class="m-1 shadow"
                    variant="primary" 
                    type="reset"
                    title="Copy table to clipboard" 
                    alt="Copy table to clipboard"	 
                    :disabled="items.length == 0" 
                    @click="copyToClipboard"> 
                    <b-icon-clipboard-plus class="mr-2" />
					<span>Copy to clipboard</span>
				</b-button>
			</b-col>
			<b-col>
				<b-form-group
					class="mr-1"
					label-cols-sm="3"
					label-align-sm="right"
					label-size="sm">
					<template v-slot:label>
						<b-icon-funnel/>
					</template>
					<b-form-input 
						size="sm"
						id="filter-input"
						class="shadow-sm"
						:disabled="items.length == 0" 
						v-model="filter"
						type="search"
						autocomplete="off"
						:placeholder="`filter ${itemClass} records`"/>	
					<div class="text-secondary">Showing {{ filterCount }} of {{ items.length }} records</div>				
				</b-form-group>
			</b-col>
		</b-row>
		<b-row>
			<b-col>
				<b-table show-empty sort-icon-left hover outlined selectable small
					style="height: 200px;"
					:id="`datatable-${itemClass}`"										
					:no-border-collapse="true"
					sticky-header="200px" 
					select-mode="single"
					primary-key="data.id"
					:per-page="perPage"
					:current-page="currentPage"
					:items="items" 
					:fields="fields"
					:filter="filter"
					@filtered="onFiltered"
					class="overflow-auto shadow-sm"
					@row-selected="rowSelected"
					:tbody-tr-class1="rowClass">

					<template #cell(actions)="row">
						<div class="text-right">
							<b-icon-x-circle width="15" height="15"
								class="action mr-2" 
								:title="`delete ${itemClass} ${row.item.data.label || '' }`" 
								:alt="`delete ${itemClass} ${row.item.data.label || '' }`"
								@click.stop="deleteItem(row.item)"/>		
						</div>				
					</template>					
										
					<template #cell(label)="row">
						<NodeIconLink :nodeID="row.item.data.id"/>
					</template>	

					<template #cell(period)="row">
						<NodeIconLink :nodeID="row.item.data.period"/>
					</template>	

					<template #cell(source)="row">
						<NodeIconLink :nodeID="row.item.data.source"/>
					</template>

					<template #cell(target)="row">
						<NodeIconLink :nodeID="row.item.data.target"/>
					</template>	

					<template #cell(parent)="row">
						<NodeIconLink :nodeID="row.item.data.parent"/>						
					</template>	

					<template #cell(included)="row">
						<TickOrCross :value="row.item.data.included"/>						
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
		</b-overlay>
		<b-row>
			<b-col>
				<b-pagination
					v-model="currentPage"
					:total-rows="filterCount"
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
import _merge from "lodash/merge"
import Papa from "papaparse"
import { ref, unref, computed, watch, inject, nextTick } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass, EdgeClass } from '@/composables/PhaserCommon'
import NodeIconLink from '@/components/NodeIconLink'
import TickOrCross from '@/components/TickOrCross'

export default {
	components: { NodeIconLink, TickOrCross },
	props: {
		selectedID: {
			type: String,
			required: false,
			default: "",
		},		
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
		const onFiltered = (items, count) => filterCount.value = count
		const sortBy = ref("data.label")
		const sortDesc = ref(false)
		const perPage = 25
		const currentPage = ref(1)
		const isBusy = ref(false) // not used yet

		// select row if node is selected somewhere else in the app (e.g. on the diagram)
		//const selectedID = computed(() => store.getters.selectedID)
		const selectedID1 = computed(() => props.selectedID)
        watch(selectedID1, async (newValue) => {	
			await nextTick() // helps to ensure subsequent scrolling works
			// scroll to ensure selected row is visible in the table
			let el = document.getElementById(`datatable-${props.itemClass}__row_${newValue}`)			
			if(el) { 
				el.click() // simulates a click on the row to highlight
				el.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"}) // scroll the selected row 
				el.scrollIntoViewIfNeeded(true)	// (TODO: should only do this if manually clicked?)
			}
        })
		
		// colour coding selected row
        const rowClass = (item, type) => {
			if (!item || type !== 'row') 
                return ""
			else            
            	return item.data.id == selectedID1.value ? "selected-row" : ""    
        }
 
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
		const filterCount = ref(items.value.length)         
		watch(rowCount, (newValue) =>  filterCount.value = newValue)
		

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

		const copyToClipboard = () => {
			let data = unref(items).map(item => {                
				let row = {}

				unref(columns).forEach(col =>{
					switch(col) {
						case "label": row[col] = item.data.label; break;
						case "period": row[col] = store.getters.labelByID(item.data.period); break;
						case "source": row[col] = store.getters.labelByID(item.data.source); break;
						case "target": row[col] = store.getters.labelByID(item.data.target); break;
						case "type": row[col] = item.data.type; break;
						case "parent": row[col] = store.getters.labelByID(item.data.parent); break;
						case "enteredMinYear": row[col] = tableMinYearFormat(null, null, item); break;
						case "enteredMaxYear": row[col] = tableMaxYearFormat(null, null, item); break;
						case "enteredDiff": row[col] = enteredDiffFormat(null, null, item); break;
						case "derivedMinYear": row[col] = derivedMinYearFormat(null, null, item); break;
						case "derivedMaxYear": row[col] = derivedMaxYearFormat(null, null, item); break;
						case "duration": row[col] = durationFormat(null, null, item); break;
						case "derivedMinDuration": row[col] = derivedMinDurationFormat(null, null, item); break;
						case "derivedMaxDuration": row[col] = derivedMaxDurationFormat(null, null, item); break;
						case "included": row[col] = item.data.included; break;
					}
				})						
				return row
			})
			let tsv = Papa.unparse(JSON.stringify(data), { delimiter: "\t" })            
            navigator.clipboard.writeText(tsv)
		}

		const fields = computed(() => {
			return [					
				// displaying label as if identifier
				... (columns.value.includes('label')) ? [{
					key: "label",
					label: "identifier",
					sortable: true,
					sortByFormatted: true,
					formatter: (value, key, item) => `${item.data.class}${item.data.label}`,					
				}] : [],
				... (columns.value.includes('period')) ? [{
					// virtual column with custom formatter
					key: 'period',
					label: 'period',
					sortable: true,
					sortByFormatted: true,
					formatter: (value, key, item) => store.getters.labelByID(item.data.period),
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
					sortable: true,
					sortByFormatted: true,
					formatter: (value, key, item) =>  store.getters.labelByID(item.data.source),						
				}] : [],  
				... (columns.value.includes('type')) ? [{
					key: "data.type",
					label: "type",
					sortable: true					
				}] : [],  
				... (columns.value.includes('target')) ? [{
					key: "target",
					label: "target",
					sortable: true,
					sortByFormatted: true,
					formatter: (value, key, item) => store.getters.labelByID(item.data.target),					
				}] : [], 				
				... (columns.value.includes('parent')) ? [{
					key: "parent",
					label: "within",
					sortable: true,
					sortByFormatted: true,
					formatter: (value, key, item) => `${store.getters.classByID(item.data.parent)}${store.getters.labelByID(item.data.parent)}`,					
                }] : [],                
				... (columns.value.includes('enteredMinYear')) ? [{
					// virtual column with custom formatter
					key: 'minyear',
					label: 'entered min year',
					sortByFormatted: true,
					formatter: tableMinYearFormat,
					sortable: true,
					class: "text-right"
				}] : [],
				... (columns.value.includes('enteredMaxYear')) ? [{
					// virtual column with custom formatter
					key: 'maxyear',
					label: 'entered max year',
					sortByFormatted: true,
					formatter: tableMaxYearFormat,
					sortable: true,
					class: "text-right"
					}] : [],
				... (columns.value.includes('enteredDiff')) ? [{
					// virtual column with custom formatter
					key: 'entereddiff',
					label: 'duration',
					sortByFormatted: true,
					formatter: enteredDiffFormat,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (columns.value.includes('derivedMinYear')) ? [{
					// virtual column with custom formatter
					key: 'derivedminyear',
					label: 'derived min year',
					sortByFormatted: true,
					formatter: derivedMinYearFormat,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (columns.value.includes('derivedMaxYear')) ? [{
					// virtual column with custom formatter
					key: 'derivedmaxyear',
					label: 'derived max year',
					sortByFormatted: true,
					formatter: derivedMaxYearFormat,
					sortable: true,
					class: "text-right"
				}] : [],
				... (columns.value.includes('duration')) ? [{
					// virtual column with custom formatter
					key: 'duration',
					label: 'duration',
					sortByFormatted: true,
					formatter: durationFormat,
					sortable: true,
					class: "text-right"
				}] : [],
				... (columns.value.includes('derivedMinDuration')) ? [{
					// virtual column with custom formatter
					key: 'derivedminduration',
					label: 'min duration',
					sortByFormatted: true,
					formatter: derivedMinDurationFormat,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (columns.value.includes('derivedMaxDuration')) ? [{
					// virtual column with custom formatter
					key: 'derivedmaxduration',
					label: 'max duration',
					sortByFormatted: true,
					formatter: derivedMaxDurationFormat,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (columns.value.includes('included')) ? [{
					key: "included",
					label: "included",	
					sortable: true,
					class: "text-center",
					sortByFormatted: true,
					formatter: (value, key, item) => item.data.included				
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
			let node = null
			let edge = null

			switch(props.itemClass) {
				case NodeClass.PHASE: node = _merge({}, store.getters.newPhase());break;
				case NodeClass.GROUP: node = _merge({}, store.getters.newGroup());break;
				case NodeClass.SUBGROUP: node = _merge({}, store.getters.newSubGroup());break;
				case NodeClass.CONTEXT: node = _merge({}, store.getters.newContext());break;
				case NodeClass.DATING: node = _merge({}, store.getters.newDating());break;
				case NodeClass.PERIOD: node = _merge({}, store.getters.newPeriod());break;
				case EdgeClass.EDGE: edge = _merge({}, store.getters.newEdge());break;							
			}
			if(node) {
				store.dispatch('insertNode', node)
				store.dispatch('setSelectedID', node.data.id)	
			}	
			else if(edge) {
				store.dispatch('insertEdge', edge)
				store.dispatch('setSelectedID', edge.data.id)	
			}
		}

		const updateItem = (item) => {
			if(item) {
				if(props.itemClass === EdgeClass.EDGE)
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
		//const tablePeriodFormatter = (value, key, item) => store.getters.labelByID(item.data.period, false)

		// table formatters for years
		const tableYearFormat = (year, tolv, tolu) => {
            if(year == null || year == "")
				return ""
			else if(tolv == 0)
				return Number(year) //`${year}`
			else
				return `${year}±${tolv}${tolu == "years" ? "y" : "%"}`
        }
		const tableMinYearFormat = (value, key, item) => {
			let dating = item.data?.dating || {}
            let year = dating.minYear
            let tolv = dating.minYearTolValue 						
            let tolu = dating.minYearTolUnit
            return tableYearFormat(year, tolv, tolu)
        }
        const tableMaxYearFormat = (value, key, item) => {
			let dating = item.data?.dating || {}
            let year = dating.maxYear
            let tolv = dating.maxYearTolValue 						
            let tolu = dating.maxYearTolUnit
            return tableYearFormat(year, tolv, tolu)
        }
        
		const derivedMinYearFormat = (value, key, item) => store.getters.derivedDates(item.data.id).minYear 		
		const derivedMaxYearFormat = (value, key, item) => store.getters.derivedDates(item.data.id).maxYear 		
		const durationFormat = (value, key, item) => store.getters.derivedDuration(item.data.id) 		
		const enteredDiffFormat = (value, key, item) => store.getters.enteredDuration(item.data.id) 
		const derivedMinDurationFormat = (value, key, item) => store.getters.derivedMinDuration(item.data.id) 	
		const derivedMaxDurationFormat = (value, key, item) => store.getters.derivedMaxDuration(item.data.id) 	
			
		return {
			store,			
			filter,
			isBusy,
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
			copyToClipboard,
			rowSelected,
			rowClass,
			filterCount,
			onFiltered,
			NodeClass,
			tableMinYearFormat,
			tableMaxYearFormat,
			derivedMinYearFormat,
			derivedMaxYearFormat,
			derivedMinDurationFormat,
			derivedMaxDurationFormat,
			durationFormat,
			enteredDiffFormat
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
/deep/ .selected-row {
	background-color: lightgray;
}
</style>

