<template>
    <b-modal centered 
        id="modalPeriodsImport" 
        title="Import Perio.do data"
        @ok="handleOK" 
        @cancel="handleClose" 
        @close="handleClose">

        <b-container class="p-0">
            <b-row align-h="between">
            <b-col>
                <b-button pill
                    size="sm"
                    variant="primary"
                    class="text-left shadow" 
                    title="refresh" 
                    alt="refresh"			
                    @click.stop="refresh">
                    <b-icon-arrow-clockwise class="mr-2" />
                    <span>Refresh</span>
                </b-button>
            </b-col>	
            <b-col>
                <b-form-group
					label="Filter"
					label-for="periods-filter-input"
					label-cols-sm="3"
					label-align-sm="right"
					label-size="sm"
					class="mb-2">
					<template v-slot:label>
						<b-icon-search />
					</template>
					<b-form-input 
						size="sm"
						id="periods-filter-input"
						class="shadow-sm"
						v-model="filter"
						type="search"
						autocomplete="off"
						placeholder="filter"/>					
				</b-form-group>
            </b-col>
            </b-row>
            <b-row><b-col>
        <b-overlay :show="busy" rounded="sm">
            <b-form-group 
                label="Collections"
                label-for="collectionList" 
                label-size="sm">
                <template v-slot:label>
                    <span>Collections</span>
                    <b-badge 
                        variant="outline" 
                        class="border secondary pb-1 m-0 ml-2">
                        <span>{{ collections.length }}</span>
                    </b-badge>
                </template>

                <b-table show-empty hover outlined selectable small 
                    style="height: 300px;"
					id="periods-table"					
					:no-border-collapse="false"
					sticky-header="300px" 
					select-mode="single"
					primary-key="id" 
					:items="collections" 
					:fields="fields"
					:filter="filter"
                    :sort-by.sync="sortBy"
                    :sort-desc.sync="sortDesc"						
					class="overflow-auto shadow-sm"
					@row-selected="rowSelected">									
				</b-table>
            </b-form-group>
            <b-form-group 
                label="Periods"
                label-for="periodsList"
                label-size="sm">
                <template v-slot:label>
                    <span>Periods</span>
                    <b-badge 
                        variant="outline" 
                        class="border secondary pb-1 m-0 ml-2">
                        <span>{{ periods.length }}</span>					
                    </b-badge>
                </template>
                <b-list-group 
                    class="shadow-sm overflow-auto m-1" 
                    style="height: 175px;" 
                    size="sm">
                    <b-list-group-item
                        size="sm"
                        v-for="(period, index) in periods" 
                        :key="index">
                        <a target="_blank" :href="`${baseURI}${period.id}`">{{ period.label }}</a>
                        &nbsp;<span>[{{ periodCoverage(period) }}]</span>
                    </b-list-group-item>
                </b-list-group>
            </b-form-group>
        </b-overlay> 
        </b-col>
        </b-row> 
        </b-container>
        <template #modal-footer="{ ok, cancel }">
            <b-button pill
                variant="primary"
                size="md"
                class="float-right"
                @click="ok()">
                <TickOrCross :value="true" class="mr-1"/>
                <span>OK</span>
            </b-button>
                    
            <b-button pill
                variant="secondary"
                size="md"
                class="float-right mr-1"
                @click="cancel()">
                <TickOrCross :value="false"  class="mr-1"/>
                <span>Cancel</span>
            </b-button>
        </template>
    </b-modal>      
</template>

<script>
import { ref, shallowRef, computed, inject } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import TickOrCross from '@/components/TickOrCross'

export default {
    components: { TickOrCross },
    setup() {
        const store = inject('store')  
        const busy = ref(false)
		const uri = "https://n2t.net/ark:/99152/p0d.json" 
        const data = shallowRef({})
        const selectedID = ref("")
        const filter = ref("")
		const sortBy = ref("title")
		const sortDesc = ref(false)

        const fields = [                		
			{
                key: "title",
				label: "title",				
                sortable: true					
			},
            {
                key: "year",
				label: "year",
				sortable: true,
                class: "text-right"				
			},
            {
                key: "periods",
				label: "periods",
				sortable: true,
                class: "text-right"					
			}
        ]        

        const baseURI = computed(() => (((data.value || {}) ["@context"] || []) [1] || {}) ["@base"] || "")  
        
        const collections = computed(() => {             
            let authorities = (data.value || {}).authorities || null      
            let items = authorities ? Object.values(authorities) : []

            return items
                .filter(item => (item.source?.title || "") !== "")
                .map(item => {                    
                    return { 
                        id: item.id,
                        title: item.source?.title, 
                        year: item.source?.yearPublished,
                        periods: Object.values(item.periods).length
                    }
                })
                //.sort((a,b) => a.source?.title > b.source?.title ? 1 : -1)
        })

        const periods = computed(() => {
            let lst = selectedID.value ? periodsForID(selectedID.value) : [] 
            return lst.sort((a,b) => a.label > b.label ? 1 : -1)
        })

        const rowSelected = (items) => {
			if(items.length > 0) {
				selectedID.value = items[0].id				
			}	
		}

        const periodsForID = (id) => {
            let authority = ((data.value || {}).authorities || {})[id]
            let periods = authority ? authority.periods : null 
            return (periods ? Object.values(periods) : [])
        }

        const periodCoverage = (period) => {
            if(period.spatialCoverage) {
                return period.spatialCoverage
                    .map(s => s.label || "")
                    .filter(item => item)
                    .join(", ")
            }
            else if(period.spatialCoverageDescription) {
                return period.spatialCoverageDescription
            }
            else
                return ""
        }

        const referenceForID = (id) => {
            let authority = ((data.value || {}).authorities || {})[id]
            if(!authority) return ""
            let authors = (authority.source?.creators || [])
                .map(item => (item.name || "").trim())
                .filter(item => item).join(", ")
            let year = authority.source?.yearPublished
            let title = authority.source?.title
            return `<b>${authors}</b> (${year})<br><i>${title}</i>`
        }

        const refresh = () => {
            busy.value = true
            
            fetch(uri)
                .then(response => response.json())
                .then(json => {
                    data.value = json
                    busy.value = false
                })
                .catch(err => {
                    console.log(err) 
                    busy.value = false
                })              
        }

        const handleOK = () => {            
            // insert the periods from the selected collection
            periods.value.forEach(p => {
                // crete a new period instance with all required fields
                let period = store.getters.newPeriod() 

                // merge selected Perio.do fields into our structure
                period.data.id = `period-${p.id}`, // allows re-import and merge
                period.data.label = p.label
                period.data.uri = `${baseURI.value}${p.id}`
                period.data.description = p.note || "" 
                period.data.dating.minYear = Number(p.start?.in?.year || p.start?.in?.earliestYear) 
                period.data.dating.maxYear = Number(p.stop?.in?.year || p.stop?.in?.latestYear)

                // create or update in store
                store.dispatch('updateNode', period)
            })           
        }

        const handleClose = () => data.value = null
        const selected = (id) => selectedID.value = id
               
        return {
            busy,
            data,
            selectedID,
            filter,
            sortBy,
            sortDesc,
            collections,
            periods,
            fields,
            baseURI,
            rowSelected,
            periodsForID,
            periodCoverage,
            referenceForID,
            refresh,
            handleOK,
            handleClose,
            selected
        }
    }
}
</script>