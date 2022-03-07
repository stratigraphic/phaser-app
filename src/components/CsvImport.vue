<template>
    <b-modal centered 
        id="modalCsvImport" 
        :title="`Import delimited ${mode}`"
        content-class="shadow" 
        @ok="handleOK" 
        @cancel="handleClose" 
        @close="handleClose">
        <div>Expected fields:</div>
        <div>{{ expectedFields.join(", ") }}</div>
        
        <!--<b-form inline class="border p-1">-->
            <b-form-file 
                size="sm"
                class="my-1"
                v-model="selectedFile"
                placeholder="Choose a file or drop it here..."
                drop-placeholder="Drop file here..."
                accept="text/csv, .csv, .tab, .txt, .tsv"
                :state="Boolean(selectedFile)" 
                @input="loadFile(selectedFile)">
            </b-form-file>          
        <!--</b-form>-->       
            <b-input-group prepend="Delimiter" class="py-2" size="sm">
                <b-form-radio-group
                    size="sm"
                    class="p-2 border"
                    v-model="delimiter"
                    :options="delimiterOptions"
                    name="delimiter">
                </b-form-radio-group>  
            </b-input-group> 
              
            <b-form-checkbox inline
                size="sm"
                class="mx-2"
                id="checkbox-header"
                v-model="hasHeader"
                name="checkbox-header"
                :value="true"
                :unchecked-value="false">
                <span>Has header row?</span>                     
            </b-form-checkbox> 
                    
        
        <!--<div>{{ selectedFile ? selectedFile.size : '' }} bytes, {{ fileData.length }} rows</div>-->
        <div class="m-2">Preview:</div>        
        <div class="overflow-auto" style="height: 300px">
            <b-table small striped stacked 
            :items = "parserPreview.data"
            :fields = fields></b-table>
        </div>           
        <!--<div>Errors:</div>
        <ul>
            <li v-for="(err, index) in fileErrors" :key="index">{{ err.message }}</li>            
        </ul>-->
        <!--<div>{{ graphData }}</div>-->
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
import { ref, shallowRef, computed, inject, onDeactivated } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
//import VuePapaParse from 'vue-papa-parse'   // for CSV I/O
import Papa from "papaparse"
import { clean, tryParseInt, EdgeType } from "@/composables/PhaserCommon"
//import MyMixin from '@/composables/MyMixin.js'
import _merge from "lodash/merge"
import TickOrCross from '@/components/TickOrCross'
//import _uniqueId  from 'lodash/uniqueId'
/*
expectedColumns: {
    phases: ["siteCode", "phaseID", "phaseLabel", "phaseStart", "phaseEnd"],
    groups: ["siteCode", "groupID", "groupLabel", "relationship", "relatedGroupID"],
    subgroups: ["siteCode", "subGroupID", "subGrouplabel", "relationship", "relatedSubGroupID"],
    contexts: ["siteCode", "contextNo", "contextType", "relationship", "relatedContextNo"], 
    datings: []               
    },
*/

export default {
    components: { TickOrCross },	
	props: {
        mode: {
            type: String,
            required: false,
            default: "contexts",
            validator: (value) => [
                "phases", "groups", "subgroups", 
                "contexts", "datings", "periods", 
                "stratigraphy", "stratigraphyold"
                ].indexOf(value.toLowerCase()) !== -1
        },        
        previewRowCount: {
            type: Number,
            required: false,
            default: 5
        },
        defaultDelimiter: {
            type: String,
            required: false,
            default: ","
        }
    },
    setup(props) {
        const store = inject('store')
        const statusMsg = shallowRef("")  
        const delimiter = ref(props.defaultDelimiter)
        const delimiterOptions = [
            { value: '\\t', text: 'Tab' },                
            { value: ',', text: 'Comma' },
            //{ value: ':', text: 'Colon' },
            { value: ';', text: 'Semicolon' },
            { value: '|', text: 'Pipe' },
            { value: ' ', text: 'Space' }               
        ]
        //const modes = ["groups", "subgroups", "contexts", "datings"]
        const hasHeader = ref(true)
        const selectedFile = ref(null)
        const fileContents = ref("")
        const overwriteOrAppend = ref("append")
        
        const expectedFields = computed(() => {
            switch(props.mode.toLowerCase()) {
                case "phases":
                    return [ "siteCode", "phaseID", "minYear", "maxYear", "description", "withinPeriod" ]
                case "groups":
                    return [ "siteCode", "groupID", "groupType", "cud", "description", "withinPeriod", "withinPhase" ]  
                case "subgroups":
                    return [ "siteCode", "subgroupID", "subgroupType", "cud", "description", "withinPeriod", "withinGroup" ]   
                case "contexts":
                    return [ "siteCode", "contextID", "contextType", "cud", "description", "withinPeriod", "withinPhase", "withinGroup", "withinSubGroup" ]         
                case "stratigraphyold":
                    return [ "siteCode", "contextNo", "contextType", "stratRelationship", "relatedContextNo" ]      
                case "stratigraphy":
                    return [ "siteCode", "sourceID", "stratRelationship", "targetID" ]                  
                case "datings":
                    return [ "siteCode", "datingID", "datingType", "minYear", "maxYear", "description", "withinPeriod", "withinContext" ]  
                case "periods":
                    return [ "periodID", "minYear", "maxYear", "description", "uri" ]                     
                default: 
                    return []
            }
        })
        // Without explicitly setting table fields, field names get automatically 'humanized' 
        // with spaces/capitals introduced - but we need to display the 'raw' field names here
        const fields = computed(() => {
            let fields = ((((parserPreview || {}).value || {}).meta || {}).fields || [])
            return fields.map(f => { return { key: f, label: f }})			
        })

        /* 
        Parses selectedFile CSV data to papaParse JSON columns format
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
        const parserPreview = computed(() => {
            const config = {
                delimiter: delimiter.value,
                encoding: "UTF-8",
                header: hasHeader.value,
                preview: props.previewRowCount,
                skipEmptyLines: "greedy"
            }   
            //let parserResult = context.root.$papa.parse(fileContents.value, config)  
            let parserResult = Papa.parse(fileContents.value, config)           
            return parserResult
        })
        /*
        const fileMeta = () => parserPreview.value.meta        
        const fileData = () => parserPreview.value.data
        const fileErrors = () => parserPreview.value.errors
        */
        const loadFile = (file) => {
            if(!file) return

            const reader = new FileReader()
            reader.onload = function(e) { 
                fileContents.value = e.target.result
                //self.$store.dispatch('loadPhaserData', data) 
            }
            reader.readAsText(file)        
        }

        const status = async (msg) => statusMsg.value = msg

        const handleOK = async () => {
            const config = {
                encoding: "UTF-8",
                delimiter: delimiter.value,
                header: hasHeader.value,
                skipEmptyLines: "greedy"
            }
            status(`Parsing delimited data...`)
            let parserResult = Papa.parse(fileContents.value, config)
            status(`Parsing delimited data...done`)

            status(`Importing delimited data...`)
            switch(props.mode) {
                case "phases": await phasesCsvToStore(parserResult.data);break;
                case "groups": await groupsCsvToStore(parserResult.data);break;            
                case "subgroups": await subGroupsCsvToStore(parserResult.data);break;
                case "contexts": await contextsCsvToStore(parserResult.data);break;
                case "datings": await datingsCsvToStore(parserResult.data);break;
                case "periods": await periodsCsvToStore(parserResult.data);break;            
                case "stratigraphy": await stratigraphyCsvToStore(parserResult.data);break;  
                case "stratigraphyold": await stratigraphyOldCsvToStore(parserResult.data);break;
            }          
            status(`Importing delimited data...done`)

            clearSelection()
        }

        const handleClose = () => clearSelection()  
        onDeactivated(() => clearSelection())

        const clearSelection = () => {
            selectedFile.value = null
            fileContents.value = ""
            status("")
        }

        const phasesCsvToStore = async (data) => {             
            // local lookup, usage: phase = phaseFromLabel.get(label)
            const phaseFromLabel = new Map()
            store.getters.phases.forEach(node => {
                phaseFromLabel.set(node.data.label || "label", node)
            })

            const periodFromLabel = new Map()
            store.getters.periods.forEach(node => {
                periodFromLabel.set(node.data.label || "label", node)
            })
           
            // for each phase record
            for (const item of data) {
                
                // get cleaned data field values
                let siteCode = clean(item.siteCode || "")
                let phaseID = clean(item.phaseID || "")
                let minYear = tryParseInt(item.minYear || null)
                let maxYear = tryParseInt(item.maxYear || null)               
                let description = clean(item.description || "")
                let withinPeriod = clean(item.withinPeriod || "")                
                
                // if phaseID doesn't exist create new structure
                if(!phaseFromLabel.has(phaseID)) {
                    phaseFromLabel.set(phaseID, store.getters.newPhase())
                }

                // get a copy of the phase to update
                let phase = _merge({}, phaseFromLabel.get(phaseID)) 
                // merge properties
                phase.data.siteCode = siteCode
                phase.data.label = phaseID
                phase.data.dating.minYear = minYear
                phase.data.dating.maxYear = maxYear  
                phase.data.description = description

                if(withinPeriod) {
                    if(!periodFromLabel.has(withinPeriod)) {
                        let period = store.getters.newPeriod()
                        period.data.label = withinPeriod
                        periodFromLabel.set(withinPeriod, period)
                        // create or update in store
                        store.dispatch('updateNode', period)
                    } 
                    // attach the dating to the parent id
                    phase.data.period = periodFromLabel.get(withinPeriod).data.id
                }
                
                // update our local copy
                phaseFromLabel.set(phaseID, phase)
                // create or update phase in store
                store.dispatch('updateNode', phase)                 
            }
        }

        const groupsCsvToStore = async (data) => {
            // local lookups, usage: group = groupFromLabel.get(label)
            const groupFromLabel = new Map()
            store.getters.groups.forEach(node => {
                groupFromLabel.set(node.data.label || "label", node)
            })

            const phaseFromLabel = new Map()
            store.getters.phases.forEach(node => {
                phaseFromLabel.set(node.data.label || "label", node)
            })

            const periodFromLabel = new Map()
            store.getters.periods.forEach(node => {
                periodFromLabel.set(node.data.label || "label", node)
            })

            for (const item of data) {
                
                // get cleaned data field values
                let siteCode = clean(item.siteCode || "")
                let groupID = clean(item.groupID || "")
                let groupType = clean(item.groupType || "")
                let cud = clean(item.cud || "").toUpperCase()
                let description = clean(item.description || "")                  
                let withinPeriod = clean(item.withinPeriod || "")
                let withinPhase = clean(item.withinPhase || "")                
                
                // if groupID doesn't exist create new structure
                if(!groupFromLabel.has(groupID)) {
                    groupFromLabel.set(groupID, store.getters.newGroup())
                }

                // get a copy of the phase to update
                let group = _merge({}, groupFromLabel.get(groupID)) 
                // merge properties
                group.data.siteCode = siteCode
                group.data.label = groupID
                group.data.cud = cud
                group.data.type = groupType
                group.data.description = description 
                
                if(withinPhase) {
                    if(!phaseFromLabel.has(withinPhase)) {
                        let phase = store.getters.newPhase()
                        phase.data.label = withinPhase
                        phase.data.siteCode = siteCode
                        phaseFromLabel.set(withinPhase, phase)
                        // create or update in store
                        store.dispatch('updateNode', phase)
                    } 
                    // attach the dating to the parent id
                    group.data.parent = phaseFromLabel.get(withinPhase).data.id
                }

                if(withinPeriod) {
                    if(!periodFromLabel.has(withinPeriod)) {
                        let period = store.getters.newPeriod()
                        period.data.label = withinPeriod
                        periodFromLabel.set(withinPeriod, period)
                        // create or update in store
                        store.dispatch('updateNode', period)
                    } 
                    // attach the dating to the parent id
                    group.data.period = periodFromLabel.get(withinPeriod).data.id
                }
                
                // update our local copy
                groupFromLabel.set(groupID, group)
                // create or update phase in store
                store.dispatch('updateNode', group) 
            }
        }

        const subGroupsCsvToStore = async (data) => {
            // local lookups, usage: subgroup = subgroupFromLabel.get(label)
            const subgroupFromLabel = new Map()
            store.getters.subgroups.forEach(node => {
                subgroupFromLabel.set(node.data.label || "label", node)
            })

            const groupFromLabel = new Map()
            store.getters.groups.forEach(node => {
                groupFromLabel.set(node.data.label || "label", node)
            })

            const periodFromLabel = new Map()
            store.getters.periods.forEach(node => {
                periodFromLabel.set(node.data.label || "label", node)
            })

            for (const item of data) {
                
                // get cleaned data field values
                let siteCode = clean(item.siteCode || "")
                let subgroupID = clean(item.subgroupID || "")
                let subgroupType = clean(item.subgroupType || "")
                let cud = clean(item.cud || "").toUpperCase()    
                let description = clean(item.description || "")            
                let withinPeriod = clean(item.withinPeriod || "")                
                let withinGroup = clean(item.withinGroup || "")                
               
                // if subgroupID doesn't exist create new structure
                if(!subgroupFromLabel.has(subgroupID)) {
                    subgroupFromLabel.set(subgroupID, store.getters.newSubGroup())
                }

                // get a copy of the subgroup to update
                let subgroup = _merge({}, subgroupFromLabel.get(subgroupID)) 
                // merge properties
                subgroup.data.siteCode = siteCode
                subgroup.data.label = subgroupID
                subgroup.data.cud = cud
                subgroup.data.type = subgroupType
                subgroup.data.description = description 

                if(withinGroup) {
                    if(!groupFromLabel.has(withinGroup)) {
                        let parent = store.getters.newGroup()
                        parent.data.siteCode = siteCode
                        parent.data.label = withinGroup
                        groupFromLabel.set(withinGroup, parent)
                        // create or update in store
                        store.dispatch('updateNode', parent)                        
                    }
                    // attach the dating to the parent id
                    subgroup.data.parent = groupFromLabel.get(withinGroup).data.id
                } 
                
                if(withinPeriod) {
                    if(!periodFromLabel.has(withinPeriod)) {
                        let period = store.getters.newPeriod()
                        period.data.label = withinPeriod
                        periodFromLabel.set(withinPeriod, period)
                        // create or update in store
                        store.dispatch('updateNode', period)
                    } 
                    // attach the dating to the parent id
                    subgroup.data.period = periodFromLabel.get(withinPeriod).data.id
                }
                
                // update our local copy
                subgroupFromLabel.set(subgroupID, subgroup)
                // create or update in store
                store.dispatch('updateNode', subgroup) 
            }
        }

        const contextsCsvToStore = async (data) => {
            // local lookups, usage: dating = datingFromLabel.get(label)
            const contextFromLabel = new Map()
            store.getters.contexts.forEach(node => {
                contextFromLabel.set(node.data.label || "label", node)
            })

            const groupFromLabel = new Map()
            store.getters.groups.forEach(node => {
                groupFromLabel.set(node.data.label || "label", node)
            })

            const subgroupFromLabel = new Map()
            store.getters.subgroups.forEach(node => {
                subgroupFromLabel.set(node.data.label || "label", node)
            })

            const phaseFromLabel = new Map()
            store.getters.phases.forEach(node => {
                phaseFromLabel.set(node.data.label || "label", node)
            })

            const periodFromLabel = new Map()
            store.getters.periods.forEach(node => {
                periodFromLabel.set(node.data.label || "label", node)
            })

            for (const item of data) {               

                // get cleaned data field values
                let siteCode = clean(item.siteCode || "")
                let contextID = clean(item.contextID || "")
                let contextType = clean(item.contextType || "")
                let cud = clean(item.cud || "").toUpperCase()                
                let description = clean(item.description || "")
                let withinPeriod = clean(item.withinPeriod || "")               
                let withinPhase = clean(item.withinPhase || "")
                let withinGroup = clean(item.withinGroup || "")
                let withinSubGroup = clean(item.withinSubGroup || "")                

                // if context doesn't exist create new
                if(!contextFromLabel.has(contextID)) {
                    contextFromLabel.set(contextID, store.getters.newContext())
                }

                // get a copy to update
                let context = _merge({}, contextFromLabel.get(contextID)) 
                // merge properties
                context.data.siteCode = siteCode
                context.data.label = contextID
                context.data.type = contextType
                context.data.cud = cud
                context.data.description = description

                if(withinPeriod) {
                    if(!periodFromLabel.has(withinPeriod)) {
                        let period = store.getters.newPeriod()
                        period.data.label = withinPeriod
                        periodFromLabel.set(withinPeriod, period)
                        // create or update in store
                        await store.dispatch('updateNode', period)
                    } 
                    // attach the dating to the parent id
                    context.data.period = periodFromLabel.get(withinPeriod).data.id
                }

                // within [subGroup | group | phase] - only one parent possible
                if(withinSubGroup) {
                    if(!subgroupFromLabel.has(withinSubGroup)) {
                        let subgroup = store.getters.newSubGroup()
                        subgroup.data.siteCode = siteCode
                        subgroup.data.label = withinSubGroup
                        subgroupFromLabel.set(withinSubGroup, subgroup)
                        // create or update in store
                        await store.dispatch('updateNode', subgroup)
                    } 
                    // attach the dating to the parent id
                    context.data.parent = subgroupFromLabel.get(withinSubGroup).data.id
                }
                else if(withinGroup) {
                    if(!groupFromLabel.has(withinGroup)) {
                        let group = store.getters.newGroup()
                        group.data.siteCode = siteCode
                        group.data.label = withinGroup
                        groupFromLabel.set(withinGroup, group)
                        // create or update in store
                        await store.dispatch('updateNode', group)
                    } 
                    // attach the dating to the parent id
                    context.data.parent = groupFromLabel.get(withinGroup).data.id
                }
                else if(withinPhase) {
                    if(!phaseFromLabel.has(withinPhase)) {
                        let phase = store.getters.newPhase()
                        phase.data.siteCode = siteCode
                        phase.data.label = withinPhase
                        phaseFromLabel.set(withinPhase, phase)
                        // create or update in store
                        await store.dispatch('updateNode', phase)
                    } 
                    // attach the dating to the parent id
                    context.data.parent = phaseFromLabel.get(withinPhase).data.id
                }

                // update our local copy
                contextFromLabel.set(contextID, context)
                // create or update in store
                store.dispatch('updateNode', context) 
            }
        }

        /* 
        TODO: Convert pre-parsed CSV fields (as papaParse JSON columns) to graph format
            input = [
                { identifier: "12345", datingType: "coin", withinContext: "C77777", minYear: 1788, maxYear: 1845 },
                { identifier: "23456", datingType: "pot", withinContext: "C88888", minYear: 1640, maxYear: 1720 },
            ]
            output = [
                { data: { label: "12345", type: "coin", parent: "context-09876", dating: { minYear: 1788, maxYear: 1845 } } },
                { data: { label: "23456", type: "pot",  parent: "context-98765", dating: { minYear: 1640, maxYear: 1720 } } }
            ]            
        */
        const datingsCsvToStore = async (data) => {
            // local lookups, usage: dating = datingFromLabel.get(label)
            const datingFromLabel = new Map()
            store.getters.datings.forEach(node => {
                datingFromLabel.set(node.data.label || "label", node)
            })

            const contextFromLabel = new Map()
            store.getters.contexts.forEach(node => {
                contextFromLabel.set(node.data.label || "label", node)
            })

            const periodFromLabel = new Map()
            store.getters.periods.forEach(node => {
                periodFromLabel.set(node.data.label || "label", node)
            })

            for (const item of data) {               

                // get cleaned data field values
                let siteCode = clean(item.siteCode || "")
                let datingID = clean(item.datingID || "")
                let datingType = clean(item.datingType || "")
                let minYear = tryParseInt(item.minYear || null)
                let maxYear = tryParseInt(item.maxYear || null)
                let description = clean(item.description || "")
                let withinPeriod = clean(item.withinPeriod || "")
                let withinContext = clean(item.withinContext || "")                

                // if datingID doesn't exist create new structure
                if(!datingFromLabel.has(datingID)) {
                    datingFromLabel.set(datingID, store.getters.newDating())
                }

                // get a copy of the subgroup to update
                let dating = _merge({}, datingFromLabel.get(datingID)) 
                // merge properties
                dating.data.siteCode = siteCode
                dating.data.label = datingID
                dating.data.type = datingType
                dating.data.description = description 
                dating.data.dating.minYear = minYear
                dating.data.dating.maxYear = maxYear
               
                // parent context
                if(withinContext) {
                    if(!contextFromLabel.has(withinContext)) {
                        let parent = store.getters.newContext()
                        parent.data.siteCode = siteCode
                        parent.data.label = withinContext
                        contextFromLabel.set(withinContext, parent)
                        // create or update in store
                        store.dispatch('updateNode', parent)
                    }
                     // attach the dating to the parent id
                    dating.data.parent = contextFromLabel.get(withinContext).data.id
                }  

                if(withinPeriod) {
                    if(!periodFromLabel.has(withinPeriod)) {
                        let period = store.getters.newPeriod()
                        period.data.label = withinPeriod
                        periodFromLabel.set(withinPeriod, period)
                        // create or update in store
                        store.dispatch('updateNode', period)
                    } 
                    // attach the dating to the parent id
                    dating.data.period = periodFromLabel.get(withinPeriod).data.id
                }

                // update our local copy
                datingFromLabel.set(datingID, dating)
                // create or update in store
                store.dispatch('updateNode', dating) 
            }
        } 

        const periodsCsvToStore = async (data) => {
            // local lookups, usage: dating = datingFromLabel.get(label)
            const periodFromLabel = new Map()
            store.getters.periods.forEach(node => {
                periodFromLabel.set(node.data.label || "label", node)
            })            

            for (const item of data) {               

                // get cleaned data field values
                let periodID = clean(item.periodID || "")
                let minYear = tryParseInt(item.minYear || null)
                let maxYear = tryParseInt(item.maxYear || null)
                let description = clean(item.description || "")
                let uri = clean(item.uri || "")

                // if periodID doesn't exist create new structure
                if(!periodFromLabel.has(periodID)) {
                    periodFromLabel.set(periodID, store.getters.newPeriod())
                }

                // get a copy to update
                let period = _merge({}, periodFromLabel.get(periodID)) 
                // merge properties
                period.data.label = periodID
                period.data.dating.minYear = minYear
                period.data.dating.maxYear = maxYear
                period.data.description = description 
                period.data.uri = uri 
                
                // update our local copy
                periodFromLabel.set(periodID, period)
                // create or update in store
                store.dispatch('updateNode', period) 
            }
        } 

        /* Convert pre-parsed CSV fields (as papaParse JSON columns) to graph format
            input = [
                { siteCode: "XSM10", contextNo: "12345", contextType: "layer", stratRelationship: "above", relatedContextNo: "23456" },
                { siteCode: "XSM10", contextNo: "23456", contextType: "pit", stratRelationship: "below", relatedContextNo: "12345"}
            ]
            output = {
                nodes: [
                    { data: { id: "context-12345", class: "context", identifier: "12345", type: "layer", siteCode: "XSM10" }},
                    { data: { id: "context-23456", class: "context", identifier: "23456", type: "pit", siteCode: "XSM10" }},
                ],
                edges: [
                    { data: { id: "context-12345-23456", source: "context-12345", target: "context-23456", type: "above" }},
                    { data: { id: "context-23456-12345", source: "context-23456", target: "context-12345", type: "below" }},
                ]
            }
        */
       const stratigraphyCsvToStore = async (data) => {

            const contextFromLabel = new Map()
            store.getters.contexts.forEach(node => {
                contextFromLabel.set(node.data.label || "label", node)
            })

            const createEdgeID = (sourceID, targetID) => `${sourceID}|${targetID}`             
            const existingEdges = new Map()
            store.getters.edges.forEach(edge => {
                let edgeID = createEdgeID(edge.data.source, edge.data.target)
                existingEdges.set(edgeID, edge)
            })

              
            for (const item of data) {

               // get clean input field values
                let siteCode = clean(item.siteCode)
                let sourceID = clean(item.sourceID)
                let targetID = clean(item.targetID)
                let relationship = clean(item.stratRelationship)                
                
                if(sourceID !== "" && targetID !== "") {                    

                    // SOURCE CONTEXT
                    // if it doesn't exist create new
                    if(!contextFromLabel.has(sourceID)) {
                        contextFromLabel.set(sourceID, store.getters.newContext())                         
                    }
                    // get a copy to update
                    let sourceNode = _merge({}, contextFromLabel.get(sourceID)) 
                    // merge properties
                    sourceNode.data.siteCode = siteCode
                    sourceNode.data.label = sourceID
                    // update our local copy
                    contextFromLabel.set(sourceID, sourceNode)
                    // create or update in store
                    store.dispatch('updateNode', sourceNode)                                    

                    // TARGET CONTEXT
                    // if targetID doesn't exist create new structure
                    if(!contextFromLabel.has(targetID)) {
                        let targetNode = store.getters.newContext()
                        targetNode.data.siteCode = siteCode
                        targetNode.data.label = targetID
                        contextFromLabel.set(targetID, targetNode)
                        // create or update in store
                        store.dispatch('updateNode', targetNode)
                    }    

                    // EDGE - source and target contexts must now exist
                    let sourceNodeID = contextFromLabel.get(sourceID).data.id
                    let targetNodeID = contextFromLabel.get(targetID).data.id
                    if(relationship == EdgeType.ABOVE || relationship == EdgeType.EQUAL) {
                        let localID = createEdgeID(sourceNodeID, targetNodeID)
                        if(!existingEdges.has(localID)) {
                            let edge = store.getters.newEdge()
                            edge.data.siteCode = siteCode
                            edge.data.source = sourceNodeID
                            edge.data.target = targetNodeID
                            edge.data.type = relationship
                            existingEdges.set(localID, edge)
                            // create or update in store
                            store.dispatch('updateEdge', edge)
                        }
                    }
                    else if(relationship == EdgeType.BELOW) {
                        // create reciprocal 'above' relationship instead
                        let localID = createEdgeID(targetNodeID, sourceNodeID)
                        if(!existingEdges.has(localID)) {
                            let edge = store.getters.newEdge()
                            edge.data.siteCode = siteCode
                            edge.data.source = targetNodeID
                            edge.data.target = sourceNodeID
                            edge.data.type = EdgeType.ABOVE
                            existingEdges.set(localID, edge)
                            // create or update in store
                            store.dispatch('updateEdge', edge)
                        }
                    }                    
                }               
            } 
        }

        const stratigraphyOldCsvToStore = async (data) => {

            const contextFromLabel = new Map()
            store.getters.contexts.forEach(node => {
                contextFromLabel.set(node.data.label || "label", node)
            })
           
            const uniqueNodes = new Map()
            const uniqueEdges = new Map()
            
            for (const item of data) {

               // get clean input field values
                let siteCode = clean(item.siteCode)
                let contextNo = clean(item.contextNo)
                let contextType = clean(item.contextType)
                let stratRelationship = clean(item.stratRelationship)
                let relatedContextNo = clean(item.relatedContextNo)
                
                if(contextNo !== "" && relatedContextNo !== "") {

                    // create identifiers for source and target nodes
                    //let sourceID = _uniqueId("context-")
                    //let targetID = _uniqueId("context-")
                    //let sourceID = `context-${utf8_to_hex(contextNo)}` // '+' caused problems in IDs
                    //let targetID = `context-${utf8_to_hex(relatedContextNo)}`

                    // add new or update existing
                    let sourceNode = null
                    if(!uniqueNodes.has(contextNo)) {
                        sourceNode = store.getters.newContext()
                    }
                    else {
                        sourceNode = uniqueNodes.get(contextNo)
                    }
                    sourceNode.data.siteCode = siteCode
                    sourceNode.data.label = contextNo
                    sourceNode.data.type = contextType
                    uniqueNodes.set(contextNo, sourceNode)
                
                    // add target node if it doesn't already exist
                    // (will be supplemented when main record 
                    // for this context is encountered later)
                    if(!uniqueNodes.has(relatedContextNo)) {
                        let targetNode = store.getters.newContext()
                        targetNode.data.siteCode = siteCode
                        targetNode.data.label = relatedContextNo                        
                        uniqueNodes.set(relatedContextNo, targetNode)
                    }                 
                    
                    // add new edge (or overwrite existing) for relationships 
                    let newEdge = store.getters.newEdge() 
                    let source = uniqueNodes.get(contextNo)
                    let sourceID = source.data.id
                    let target = uniqueNodes.get(relatedContextNo)
                    let targetID = target.data.id

                    // if relationship is "above" or "equal", add (or overwrite) 
                    if(stratRelationship == EdgeType.ABOVE || stratRelationship == EdgeType.EQUAL) {
                        let tempID = `edge-${contextNo}-${relatedContextNo}`
                        newEdge.data.siteCode = siteCode
                        newEdge.data.source = sourceID
                        newEdge.data.target = targetID
                        newEdge.data.type = stratRelationship
                        uniqueEdges.set(tempID, newEdge)
                    }

                    // if relationship is "below", store reciprocal "above" instead
                    else if(stratRelationship == EdgeType.BELOW) {
                        let tempID = `edge-${relatedContextNo}-${contextNo}`
                        newEdge.data.siteCode = siteCode
                        newEdge.data.source = targetID
                        newEdge.data.target = sourceID
                        newEdge.data.type = EdgeType.ABOVE
                        uniqueEdges.set(tempID, newEdge)                        
                    }
                }                
            } 

            /*let output =  {
                nodes: [...uniqueNodes.values()],   // Map values as array            
                edges: [...uniqueEdges.values()]    // Map values as array          
            } 
            console.log(output)  */       
            //console.log(`contextDataToGraph: ${output.nodes.length} nodes, ${output.edges.length} edges`)   
            //return output

            // IMPORTANT TODO: not checking whether they exist first!! DOh...
            // and - there is no containment indicated in the CSV file, 
            // contexts maybe within phases, groups or subgroups
            await store.dispatch('insertNodes',  [...uniqueNodes.values()])
            store.dispatch('insertEdges',  [...uniqueEdges.values()])

            //await store.dispatch('insertEdges',  [...uniqueEdges.values()])
            //output.nodes.forEach(node => store.dispatch('insertContext', node)) 
            //output.edges.forEach(edge => store.dispatch('insertEdge', edge)) 
        }           

        return {
            statusMsg,
            expectedFields,
            delimiter,
            delimiterOptions,
            hasHeader,
            selectedFile,
            parserPreview,
            fields,
            overwriteOrAppend,
            handleOK,
            handleClose, 
            loadFile
        }
    }
}
</script>