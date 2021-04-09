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
                    variant="outline-primary"
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
						size="md"
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
                label-for="collectionList">
                <template v-slot:label>
                    <span>Collections</span>
                    <b-badge 
                        variant="outline" 
                        class="border secondary pb-1 m-0 ml-2">
                        <span>{{ collections.length }}</span>
                    </b-badge>
                </template>

                <b-table show-empty style="height: 300px;"
					id="periods-table"
					hover outlined selectable small 
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

                <!--<b-list-group 
                    class="shadow-sm overflow-auto m-1" 
                    style="height: 175px;"
                    filter="herit">
                    <b-list-group-item button 
                        v-for="(collection, index) in collections" 
                        :key="index"
                        @click.stop="selected(collection.id)">                        
                        <span v-html="referenceForID(collection.id)"/>
                        <b-badge 
                            variant="outline"                             
                            class="border secondary ml-2">
                            <span>{{ periodsForID(collection.id).length }} periods</span>
                        </b-badge>                        
                    </b-list-group-item>
                </b-list-group>-->
            </b-form-group>
            <b-form-group 
                label="Periods"
                label-for="periodsList">
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
                    style="height: 175px;">
                    <b-list-group-item
                        v-for="(period, index) in periods" 
                        :key="index"><a target="_blank" :href="`${baseURI}${period.id}`">{{ period.label }}</a> [{{ periodCoverage(period) }}]</b-list-group-item>
                </b-list-group>
            </b-form-group>
        </b-overlay> 
        </b-col>
        </b-row> 
        </b-container>
    </b-modal>      
</template>

<script>

export default {
	name: 'PeriodsImport',
	components: { },
	props: { },
	data() {
		return {
            busy: false,
			uri: "https://n2t.net/ark:/99152/p0d.json", 
            data: {},
            selectedID: "",
            filter: "",
			sortBy: "title",
			sortDesc: false	
		}
	},
	computed: {	
        baseURI() {
            return (((this.data || {}) ["@context"] || []) [1] || {}) ["@base"] || ""            
        },

        collections() {             
            let authorities = (this.data || {}).authorities || null      
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
        },
        periods() {
            let lst = this.selectedID ? this.periodsForID(this.selectedID) : [] 
            return lst.sort((a,b) => a.label > b.label ? 1 : -1)
        },
        fields() {
			return [                		
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
        }
    },
	methods: {
        rowSelected(items){
			if(items.length > 0) {
				this.selectedID = items[0].id				
			}	
		},
        periodsForID(id) {
            let authority = ((this.data || {}).authorities || {})[id]
            let periods = authority ? authority.periods : null 
            return (periods ? Object.values(periods) : [])
        },        
        periodCoverage(period) {
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

        },
        referenceForID(id) {
            let authority = ((this.data || {}).authorities || {})[id]
            if(!authority) return ""
            let authors = (authority.source?.creators || [])
                .map(item => (item.name || "").trim())
                .filter(item => item).join(", ")
            let year = authority.source?.yearPublished
            let title = authority.source?.title
            return `<b>${authors}</b> (${year})<br><i>${title}</i>`
        },

        refresh() {
            var self = this
            self.busy = true
            
            fetch(self.uri)
                .then(response => response.json())
                .then(data => {
                    self.data = data
                    self.busy = false
                })
                .catch(err => {
                    console.log(err) 
                    self.busy = false
                })              
        },
        handleOK() {
            // const self = this 
            // insert the selected periods collection into the data
            this.periods.forEach(p => {
                //let period = this.$store.getters.newPeriod()                

                this.$store.dispatch('insertPeriod', { 
                    data: {
                        id: `period-${p.id}`,
                        label: p.label,
                        uri: `${this.baseURI}${p.id}`,
                        description: p.note || "",
                        dating: {
                            minYear: Number(p.start?.in?.year || p.start?.in?.earliestYear),
                            maxYear: Number(p.stop?.in?.year || p.stop?.in?.latestYear)
                        }
                    }
                })
            })           
        },
        handleClose() {
            this.data = null            
        },
        selected(id) {
            this.selectedID = id
        }
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
