<template>
	<b-container fluid class="p-2 m-0">  
        <b-row no-gutters>			
			<b-col> 
                <b-dropdown block
                    size="sm"
                    ref="nodeClassOptionsDropdown"
                    title="Select elements to search for" 
                    alt="Select elements to search for"
                    menu-class="w-100"
                    variant="light"
                    class="m-0 p-0 border">
                    <template #button-content>{{searchElementHeader}}</template>
                    <template #default>
                             
                        <b-form-checkbox
                            size="sm"
                            class="ml-2"
                            v-model="allNodeClassesSelected"
                            @change="toggleAllNodeClasses">
                            <span>Toggle all</span>
                        </b-form-checkbox>

                        <b-form-checkbox-group stacked
                            size="sm"
                            name="nodeClassSelection"
                            class="p-0 ml-4"
                            @change="clearResults"
                            v-model="selectedNodeClasses"
                            :options="nodeClassOptions"/>
                        
                    </template>
                </b-dropdown>
            </b-col>
            <b-col> 
                <b-dropdown block
                    size="sm"
                    ref="nodeParentDropdown"
                    title="Select elements to search within" 
                    alt="Select elements to search within"
                    menu-class="w-100"
                    variant="light"
                    class="mx-1 p-0 border">
                    <template #button-content>{{searchWithinHeader}}</template>
                     <template #default>
                        <b-form-select 
                            size="sm" 
                            class="p-0 m-0" 
                            :select-size="8"
                            v-model="selectedNodeParent" 
                            @change="nodeParentSelected"               
                            :options="nodeParentOptions"/>
                    </template>
                </b-dropdown>
            </b-col>
            <b-col>
                <b-dropdown block
                    size="sm"
                    ref="nodePeriodDropdown"
                    title="Select period to search for" 
                    alt="Select period to search for"
                    menu-class="w-100"
                    variant="light"
                    class="mx-1 p-0 border">
                    <template #button-content>{{searchPeriodHeader}}</template>
                     <template #default>
                        <b-form-select  
                            size="sm"
                            class="p-0 m-0" 
                            :select-size="8"
                            v-model="selectedNodePeriod" 
                            @change="nodePeriodSelected"               
                            :options="nodePeriodOptions"/>
                    </template>                          
                
                </b-dropdown>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-button-group class="my-1">
                <!--TODO: date range criteria?-->
                    <b-button
                        pill 
                        size="sm"
                        class="m-1"
                        variant="primary"                         
                        type="submit" 
                        title="Search" 
                        alt="Search"	
                        :disabled="isSearchDisabled" 
                        @click="onSubmit">
                        <b-icon-search class="mr-2"/>Search</b-button>
                    <b-button 
                        pill
                        size="sm"
                        class="m-1"
                        variant="primary" 
                        type="reset"
                        title="Copy results to clipboard" 
                        alt="Copy results to clipboard"	 
                        :disabled="isCopyDisabled" 
                        @click="copyToClipboard"> 
                        <b-icon-clipboard-plus class="mr-2" />Copy</b-button>
                    <b-button 
                        pill
                        size="sm"
                        class="m-1"
                        variant="primary" 
                        type="reset" 
                        title="Clear all" 
                        alt="Clear all"	
                        :disabled="isResetDisabled" 
                        @click="onReset"> 
                        <b-icon-trash class="mr-2"/>Clear</b-button>
                </b-button-group>   
            </b-col>
            <b-col>
				<b-form-group
                    class="m-1"
					label-cols-sm="3"
					label-align-sm="right"
					label-size="sm">
					<template v-slot:label>
						<b-icon-funnel />
					</template>
					<b-form-input 
						size="sm"
						id="filter-results"
						class="shadow-sm"
						v-model="filter"
						type="search"
						autocomplete="off"
						placeholder="filter results"/>	
                    <div class="text-secondary">Showing {{ filterCount }} of {{ searchResults.length }} results</div>				
				</b-form-group> 
			</b-col>
		</b-row>
        <!--<b-row align-h="between">			
			<b-col>
				<b-pagination
                    v-model="currentPage"
                    :total-rows="rowCount"
                    :per-page="perPage"
                    aria-controls="my-table"
                    :first-number="true"
                    :last-number="true"/>
			</b-col>
			
		</b-row>-->
        

        <b-table show-empty small striped hover outlined sort-icon-left
            style="height: 600px;" 
			id="datatable-searchresults"
			:no-border-collapse="true"
			:sticky-header="true"
            :filter="filter"
            :filter-ignored-fields="['nodeID', 'periodID', 'parentID']"
            :filter-included-fields="['nodeLabel', 'nodeType', 'description', 'periodLabel', 'parentLabel']"
			primary-key="data.id"
			:items="dataForDisplay" 
			:fields="fields"
            :per-page="perPage"
			:current-page="currentPage"
            :no-select-on-click="true"
			class="overflow-auto shadow-sm"
            @filtered="onFiltered"
			@row-selected="rowSelected">                
            <template #cell(nodeLabel)="row">
                <NodeIconLink :nodeID="row.item.nodeID"/>                
			</template>
            <template #cell(nodeType)="row">{{ truncate(row.item.nodeType, 30) }}</template>
            <template #cell(parentLabel)="row">
                <NodeIconLink :nodeID="row.item.parentID"/>   
                
			</template>	
            <template #cell(periodLabel)="row">
                <NodeIconLink :nodeID="row.item.periodID"/>               
			</template>
            <template #cell(derivedDates)="row"> 
                <YearRangeDisplay :minYear="row.item.minYear" :maxYear="row.item.maxYear" :showDuration="true"/>                          
            </template>          
        </b-table>
        <!--<ColourPicker colour="yellow" :disabled="false"	/>-->	  

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
import { ref, unref, computed, inject, watch } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass, truncate } from '@/composables/PhaserCommon'
import Papa from "papaparse"
import { isDating } from '@/composables/PhaserCommon'
import NodeIconLink from '@/components/NodeIconLink'
import YearRangeDisplay from '@/components/YearRangeDisplay'


//import ColourPicker from '@/components/ColourPicker'

export default {
    components: { 
        NodeIconLink,
        YearRangeDisplay
    },
	props: {},

	setup() {
        const store = inject('store')
        const isBusy = ref(false)
        const nodeParentDropdown = ref(null) // instance ref to programmatically control it
        const nodePeriodDropdown = ref(null) // instance ref to programmatically control it
        const perPage = 25 // for pagination, which is currently removed
		const currentPage = ref(1) // for pagination, which is currently removed
        const rowCount = computed(() => searchResults.value.length)
        
        const filter = ref("")
        const filterCount = ref(0) 
        const onFiltered = (items, count) => filterCount.value = count

        const nodeClassOptions = [NodeClass.PHASE, NodeClass.GROUP, NodeClass.SUBGROUP, NodeClass.CONTEXT, NodeClass.DATING] // Object.values(NodeClass)
        const selectedNodeClasses = ref([]) 
        const allNodeClassesSelected = ref(false)        
        const toggleAllNodeClasses = checked => selectedNodeClasses.value = checked ? nodeClassOptions.slice() : []  

        watch(selectedNodeClasses, (newValue) => {
            // Handle changes in individual checkboxes
            if (newValue.length === 0) {
                allNodeClassesSelected.value = false
            } else if (newValue.length === nodeClassOptions.length) {
                allNodeClassesSelected.value = true
            } else {
                allNodeClassesSelected.value = false
            }
        })

        const selectedNodeParent = ref("")
        const selectedNodePeriod = ref("")
        const searchResults = ref([]) 
        
        const itemCount = nc => {
			switch(nc) {
				case NodeClass.PHASE: return store.getters.phases.length
				case NodeClass.GROUP: return store.getters.groups.length
				case NodeClass.SUBGROUP: return store.getters.subgroups.length
				case NodeClass.CONTEXT: return store.getters.contexts.length
				case NodeClass.DATING: return store.getters.datings.length				
				default: return 0
			}
		}

        const dataForDisplay = computed(() => {
            return searchResults.value.map(node => {
                let dates = null
                if(isDating(node))
                    dates = store.getters.enteredDatesForNode(node)
                else
                    dates = store.getters.derivedNodeDates(node.data.id)
                            
                return {
                    nodeID: node.data?.id || "",
                    nodeClass: node.data?.class || "",
                    nodeLabel: store.getters.labelByID(node.data.id, false) || "",
                    nodeType: node.data?.type || "",
                    description: node.data?.description || "",
                    periodID: node.data?.period || "",
                    periodLabel:  store.getters.labelByID(node.data.period, false) || "",
                    parentID: node.data?.parent || "",
                    parentLabel:  store.getters.labelByID(node.data.parent, false) || "", 
                    minYear: dates.minYear,
                    maxYear: dates.maxYear,                 
                }
            })            	
        })

        const copyToClipboard = () => {
            let dataforClipboard = dataForDisplay.value.map(item => {                
                return {
                    id: item.nodeLabel,
                    type: item.nodeType,
                    description: item.description,
                    period: item.periodLabel,
                    within: item.parentLabel,
                    minYear: item.minYear,
                    maxYear: item.maxYear                             
                }            
            })
            let tsv = Papa.unparse(JSON.stringify(dataforClipboard), { delimiter: "\t" })            
            navigator.clipboard.writeText(tsv)
        } 
        
        const searchElementHeader = computed(() => `Elements: ${ unref(selectedNodeClasses).length > 0 ? unref(selectedNodeClasses).join(", ") : "(none)"}`)
        const searchWithinHeader = computed(() => {
            let nodeLabel = "(any)"
            if(selectedNodeParent.value) 
                nodeLabel = store.getters.labelByID(unref(selectedNodeParent), true)
            return `Within: ${nodeLabel}`
        })
        const searchPeriodHeader = computed(() => {
            let nodeLabel = "(any)"
            if(selectedNodePeriod.value) 
                nodeLabel = store.getters.labelByID(unref(selectedNodePeriod), false)
            return `Period: ${nodeLabel}`
        })
        /*const toggleAllNodeClasses = (checked) => {
            selectedNodeClasses.value == checked ? nodeClassOptions.slice() : []
        }*/
        //const onClick = () => { nodeClassOptionsDropdown.value.hide(true) }

        const nodeParentOptions = computed(() => {
            return [{ value: "", text: "(any)", selected: true }]       
                .concat(store.getters.phaseOptionsGrouped)
                .concat(store.getters.groupOptionsGrouped)
                .concat(store.getters.subgroupOptionsGrouped)
        })  
        const nodePeriodOptions = computed(() => {
            return [{ value: "", text: "(any)", selected: true }]       
                .concat(store.getters.periodOptions)
        })   
        const nodeParentSelected = () => {
            nodeParentDropdown.value.hide()
            clearResults()
        } 
        const nodePeriodSelected = () => {
            nodePeriodDropdown.value.hide()
            clearResults()
        }     
        
        const clearResults = () => {
            searchResults.value = [] 
            filter.value = ""
            filterCount.value = 0
        }
        
        const onSubmit = async (event) => {
            event.preventDefault()            
            isBusy.value = true

            clearResults() 
            
            let nodes = []
            
            // filter on selected parent (i.e. everything within this node)
            if(selectedNodeParent.value)
                nodes = store.getters.descendantsOfID(selectedNodeParent.value)
            else 
                nodes = store.getters.nodes
           
            // further filter on selected period and element type(s)
            searchResults.value = nodes
                .filter(n => selectedNodePeriod.value ? n.data.period == unref(selectedNodePeriod) : true)
                .filter(n => unref(selectedNodeClasses).indexOf(n.data.class) !== -1)

            filterCount.value = searchResults.value.length             
            isBusy.value = false
        }

		const onReset = (event) => {
            event.preventDefault()
            selectedNodeClasses.value = [] 
            selectedNodeParent.value = ""
            selectedNodePeriod.value = ""
            clearResults()
            isBusy.value = false
        }

		// computed properties 
		const isSearchDisabled = computed(() => selectedNodeClasses.value.length === 0)
        const isCopyDisabled = computed (() => searchResults.value.length === 0)
		const isResetDisabled = computed(() => selectedNodeParent.value == "" && selectedNodeClasses.value.length == 0)	
        
        const rowSelected = () => {}

        const fields = computed(() => {
			return [           
                {
                    key: "nodeLabel",
                    label: "id",
                    sortable: true					
                }, 
                {
					key: 'periodLabel',
					label: 'period',
					sortable: true					
				},         
                {
					key: "nodeType",
					label: "type",
					sortable: true					
				}, 
                {
					key: 'derivedDates',
					label: 'years',
					sortable: false					
				},
                /*{
					key: "description",
					label: "description",
					sortable: true					
				},*/                
                {
					key: "parentLabel",
					label: "within",
					sortable: true					
				},                 
                
			]		
		})        
				
		return {
            store,
            perPage,
            currentPage,
            rowCount,
            filter,
            filterCount,
            onFiltered,
            truncate,
            NodeClass,
            searchElementHeader,
            searchWithinHeader,
            searchPeriodHeader,
            nodeClassOptions, 
            toggleAllNodeClasses,           
			nodeParentOptions, 
            nodePeriodOptions, 
            nodeParentSelected,   
            nodePeriodSelected,
            selectedNodeClasses,
            allNodeClassesSelected,
            selectedNodeParent,
            selectedNodePeriod,
            onSubmit,
            onReset,
            isSearchDisabled,
			isResetDisabled,
            isCopyDisabled,
            searchResults,
            clearResults,
            rowSelected,
            fields,
            dataForDisplay,
            nodeParentDropdown,
            nodePeriodDropdown,
            copyToClipboard
		}
	}
}
</script>
<style scoped>
a:hover {
	color: red;	
}
</style>