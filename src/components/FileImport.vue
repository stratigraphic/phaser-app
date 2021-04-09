<template>
    <b-modal centered 
        id="modalFileImport" 
        title="Import delimited file"
        @ok="handleOK" 
        @cancel="handleClose" 
        @close="handleClose">
        <b-form inline class="border p-1">
            <b-form-file plain
                v-model="selectedFile"
                placeholder="Choose a file or drop it here..."
                drop-placeholder="Drop file here..."
                accept="text/csv, .csv, .tab, .txt, .tsv"
                :state="Boolean(selectedFile)" 
                @input="loadFile(selectedFile)">
            </b-form-file>          
                
            <b-input-group prepend="Delimiter" class="py-2">
                <b-form-radio-group
                    class="p-2 border"
                    v-model="delimiter"
                    :options="delimiterOptions"
                    name="delimiter">
                </b-form-radio-group>  
            </b-input-group>   
            <b-form-checkbox inline 
                class="mx-2"
                id="checkbox-header"
                v-model="hasHeader"
                name="checkbox-header"
                :value="true"
                :unchecked-value="false">
                <span>Has header row?</span>                     
            </b-form-checkbox>            
        </b-form>
        <!--<div>{{ selectedFile ? selectedFile.size : '' }} bytes, {{ fileData.length }} rows</div>-->
        <div class="m-2">Preview:</div>        
        <div class="overflow-auto" style="height: 200px">
            <b-table small striped stacked :items="parserPreview"></b-table>
        </div>           
        
        <!--<div>Errors:</div>
        <ul>
            <li v-for="(err, index) in fileErrors" :key="index">{{ err.message }}</li>            
        </ul>-->
        <!--<div>{{ graphData }}</div>-->
    </b-modal>	
</template>

<script>
//import MyMixin from '@/mixins/MyMixin.js'
import _merge from "lodash/merge"
//import _uniqueId  from 'lodash/uniqueId'

// used to avoid node/edge IDs having invalid characters
const str2hex = str => Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')

export default {
	name: 'FileImport',
	components: {},
	mixins: [],
	props: {
        defaultDelimiter: {
            type: String,
            required: false,
            default: ","
        }
    },
	data() {
		return {
            delimiter: this.defaultDelimiter,
            delimiterOptions: [
                { value: '\\t', text: 'Tab' },                
                { value: ',', text: 'Comma' },
                //{ value: ':', text: 'Colon' },
                { value: ';', text: 'Semicolon' },
                { value: '|', text: 'Pipe' },
                { value: ' ', text: 'Space' }               
            ],
            /*expectedColumns: {
                phases: ["siteCode", "phaseID", "phaseLabel", "phaseStart", "phaseEnd"],
                groups: ["siteCode", "groupID", "groupLabel", "relationship", "relatedGroupID"],
                subgroups: ["siteCode", "subGroupID", "subGrouplabel", "relationship", "relatedSubGroupID"],
                contexts: ["siteCode", "contextNo", "contextType", "relationship", "relatedContextNo"],                
            },*/
            hasHeader: true,
            previewRows: 5,
            selectedFile: null,
            fileContents: "",
            //parserResult: null,
            //parserErrors: []

		}
    },    
	computed: {
        /*fileData() {
            return ((this.parserResult || {}).data || [])
        },
        fileErrors() {
            return ((this.parserResult || {}).errors || [])
        },
        fileMeta() {
            return ((this.parserResult || {}).meta || {})
        },*/  
        
        /* 
        Parse selectedFile CSV data to papaParse JSON columns format
        example input: 
        siteCode,contextNo,contextType,stratRelationship,relatedContextNo
        "XSM10","12345","layer","above","23456"
        "XSM10","23456","pit","below","12345"
        example output:
        [
            { siteCode: "XSM10", contextNo: "12345", contextType: "layer", stratRelationship: "above", relatedContextNo: "23456" },
            { siteCode: "XSM10", contextNo: "23456", contextType: "pit", stratRelationship: "below", relatedContextNo: "12345" },
        ]
        */
        parserPreview() {
            const self = this
            const config = {
                delimiter: self.delimiter,
                encoding: "UTF-8",
                header: self.hasHeader,
                preview: self.previewRows,
                skipEmptyLines: "greedy"
            }             
            let parserResult = self.$papa.parse(self.fileContents, config)          
            return parserResult.data
        }
    },
	methods: {        
        loadFile(file) {
            if(!file) return

            const self = this
            const reader = new FileReader()
            reader.onload = function(e) { 
                self.fileContents = e.target.result
                //self.$store.dispatch('loadPhaserData', data) 
            }
            reader.readAsText(file)
        },
        handleOK() {
            const self = this
            const config = {
                delimiter: self.delimiter,
                encoding: "UTF-8",
                header: self.hasHeader,
                skipEmptyLines: "greedy"
            } 
            let parserResult = self.$papa.parse(self.fileContents, config)
            let graph = self.contextDataToGraph(parserResult.data)
            this.$store.dispatch('clearAll') 
            this.$store.dispatch('loadMatrixData', graph) 
            this.selectedFile = null
            this.fileContents = ""
        },
        handleClose(){
            this.selectedFile = null
            this.fileContents = ""
        },     
        
        /* Convert pre-parsed CSV fields (as JSON columns) to graph format
            input = [{
                siteCode: "XSM10",
                contextNo: "12345",
                contextType: "layer",
                stratRelationship: "above",
                relatedContextNo: "23456"
            },
            {
                siteCode: "XSM10",
                contextNo: "23456",
                contextType: "pit",
                stratRelationship: "below",
                relatedContextNo: "12345"
            }]
            output = {
                nodes: [
                    { id: "context-12345", class: "context", identifier: "12345", type: "layer", siteCode: "XSM10" },
                    { id: "context-23456", class: "context", identifier: "23456", type: "pit", siteCode: "XSM10" },
                ],
                edges: [
                    { id: "context-12345-23456", source: "context-12345", target: "context-23456", type: "above" },
                    { id: "context-23456-12345", source: "context-23456", target: "context-12345", type: "below" },
                ]
            }
        */
        contextDataToGraph(data) { 
            const clean = s => (s || "").toString().trim()
            
            const uniqueNodes = new Map()
            const uniqueEdges = new Map()

            for (const item of data) {
                // get clean input field values
                let cleanSiteCode = clean(item.siteCode)
                let cleanContextNo = clean(item.contextNo).toLowerCase()
                let cleanContextType = clean(item.contextType).toLowerCase()
                let cleanStratRelationship = clean(item.stratRelationship).toLowerCase()
                let cleanRelatedContextNo = clean(item.relatedContextNo).toLowerCase()
                
                if(cleanStratRelationship == "above" && 
                    cleanContextNo !== "" && 
                    cleanRelatedContextNo !== "") {

                    // create identifiers for source and target nodes
                    //let sourceID = _uniqueId("context-")
                    //let targetID = _uniqueId("context-")
                    let sourceID = `context-${str2hex(cleanContextNo)}` // '+' caused problems in IDs
                    let targetID = `context-${str2hex(cleanRelatedContextNo)}`

                     // create new source node
                    let sourceNode = { 
                        data: {
                            id: sourceID,
                            class: "context",
                            label: cleanContextNo,
                            type: cleanContextType,                            
                            siteCode: cleanSiteCode 
                        }                   
                    }    

                    // if we already had it then merge any new data
                    if(uniqueNodes.has(sourceID)) { 
                        let oldNode = uniqueNodes.get(sourceID)
                        sourceNode = _merge(oldNode, sourceNode)
                    }

                    // add source node (or overwrite existing)
                    uniqueNodes.set(sourceID, sourceNode)  
                
                    // add target node only if it doesn't already exist
                    if(!uniqueNodes.has(targetID)) {
                        // add as new 'skeleton' target node
                        // (will be supplemented when main record 
                        // for this context is encountered later)
                        uniqueNodes.set(targetID, { 
                            data: {
                                id: targetID,
                                class: "context",
                                label: cleanRelatedContextNo,
                                siteCode: cleanSiteCode 
                            }                   
                        }) 
                    }                 
                    
                    // add new edge (or overwrite existing)
                    let edgeID = `${sourceID}-${targetID}`
                    uniqueEdges.set(edgeID, { 
                        data: {
                            id: edgeID,
                            source: sourceID,
                            target: targetID,
                            type: cleanStratRelationship 
                        }                   
                    }) 
                }                
            }

            return {
                nodes: [...uniqueNodes.values()],   // Map values as array            
                edges: [...uniqueEdges.values()]    // Map values as array          
            }
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