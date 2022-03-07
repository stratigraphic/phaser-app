import Vue from "vue"
import Vuex from "vuex"
//import { createStore } from 'vuex'
//import createPersistedState from "vuex-persistedstate"
//import createPersistedState from "vuex-persist-indexeddb"
import { NodeClass, EdgeClass, EdgeType, utf8_to_hex, clean } from "@/composables/PhaserCommon"
import _merge from "lodash/merge"
import _uniqueId from "lodash/uniqueId"

Vue.use(Vuex)

//const plugins = [ createPersistedState({ storage: window.localStorage, paths: ["nodes", "edges"] }) ]

// temporarily disable the persistence..
//const plugins = [ createPersistedState({ paths: ["about", "nodes", "edges"] }) ]

const state = {        
    appName: "Phaser",  // application name
    appVersion: "1.15", // application version    
    selectedID: "",     // ID of currently selected node  
    diagramLock: true,  // nodes cannot be moved on diagram when locked 
    about: {            // dataset metadata (see MetaEditor.vue)
        title: "",      // e.g. "My example project"
        description: "",    // description of the dataset
        creator: "",    // e.g. "Ceri Binding, University of South Wales"
        contact: "",    // email e.g. "ceri.binding@southwales.ac.uk"
        license: "",    // URL e.g. "https://creativecommons.org/licenses/by/4.0/"
        version: "",    // e.g. 1.2.3, 20210113 etc.        
    },

    // Array slow for retrieving object by ID, vuex doesn't (currently) support Map() 
    // so using nodes & edges objects with IDs as properties 
    nodes: {},          // phases, groups, subgroups, contexts, datings, periods
    edges: {},          // represents context stratigraphy (context ABOVE context)

    types: Object.freeze({            
        groupTypes: [ // TODO: load from external JSON or CSV. Part of config?
            "Building", 
            "Corn-drying oven", 
            "Ditch overall", 
            "Drain", 
            "Four-post structure", 
            "Hearth", 
            "Kiln", 
            "Oven", 
            "Post-hole: group", 
            "Road", 
            "Structure", 
            "Well"  
        ],
        contextTypes: [ // TODO: load from external JSON or CSV. Part of config?
            "Animal disturbance",
            "Animal disturbance: fill",
            "Ard mark",
            "Ard mark: fill",
            "Bank",
            "Beam slot",
            "Beam slot: fill",
            "Beam",
            "Coffin",
            "Coffin: fill",
            "Coffin: stain",
            "Corn-drying oven: cut",
            "Corn-drying oven: fill",
            "Corn-drying oven: wall",
            "Cremation pit",
            "Cremation pit: fill",
            "Cremation vessel",
            "Cremation vessel: fill",
            "Cremation",
            "Ditch segment",
            "Ditch segment: fill",
            "Ditch",
            "Ditch: fill",
            "Drain: capping",
            "Drain: construction trench fill",
            "Drain: construction trench",
            "Drain: fill",
            "Drain: lining",
            "Drain: packing",
            "Drain: pipe",
            "Drove way",
            "Enclosure",
            "Feature",
            "Feature: fill",
            "Floor",
            "Floor: tessellated",
            "Flue",
            "Flue: fill",
            "Foundation: cut",
            "Foundation: layer",
            "Furnace",
            "Grave",
            "Grave: fill",
            "Gully",
            "Gully: fill",
            "Hearth pit",
            "Hearth pit: fill",
            "Hearth: debris",
            "Hoof print",
            "Hoof print: fill",
            "Interface",
            "Kiln: debris",
            "Kiln: fill",
            "Kiln: lining",
            "Layer",
            "Layer: accumulation",
            "Layer: buried soil",
            "Layer: levelling",
            "Layer: natural",
            "Layer: occupation",
            "Layer: plough soil",
            "Layer: redeposited natural",
            "Layer: rubble",
            "Layer: subsoil",
            "Layer: topsoil",
            "Lens",
            "Linear feature",
            "Linear feature: fill",
            "Modern intrusion",
            "Modern intrusion: fill",
            "Natural feature",
            "Natural feature: fill",
            "Palaeochannel",
            "Palaeochannel: fill",
            "Pit",
            "Pit, cess",
            "Pit, cess: fill",
            "Pit: fill",
            "Pit: lining",
            "Plough furrow",
            "Plough furrow: fill",
            "Plough mark",
            "Plough mark: fill",
            "Post-hole",
            "Post-hole: fill",
            "Post-hole: packing",
            "Post-pad",
            "Post-pipe",
            "Post-pipe: fill",
            "Pottery: spread",
            "Quarry pit",
            "Quarry pit: fill",
            "Ring ditch",
            "Robbing trench",
            "Robbing trench: fill",
            "Stake",
            "Stake-hole",
            "Stake-hole: fill",
            "Stoke hole",
            "Stoke hole: fill",
            "Surface",
            "Surface: earth/clay",
            "Surface: metalled",
            "Surface: mortar",
            "Surface: paved",
            "Threshold",
            "Tree hollow",
            "Tree hollow: fill",
            "Trial trench",
            "Trial trench: fill",
            "Vessel",
            "Vessel: fill",
            "Wall",
            "Wall: construction trench fill",
            "Wall: construction trench",
            "Well: construction pit fill",
            "Well: construction pit",
            "Well: fill",
            "Well: lining",
            "Wheel rut",
            "Wheel rut: fill"
        ],
        datingTypes: [ // TODO: load from external JSON or CSV. Part of config?
            "find",
            "sample",
            "manual"
        ]            
    })    
}

// for use in node lookups
const nodeOptionSort = (a, b) => a.text > b.text ? 1 : -1

// for use in type lookups
const typeOptions = (items) => items.map(s => { return { value: s, text: s }}) 

const getters = { 
    appName: state => state.appName,                // application name - for UI display
    appVersion: state => state.appVersion,          // application version - for UI display
    selectedID: state => state.selectedID,          // currently selected node identifier
    diagramLock: state => state.diagramLock,        // lock prevents inadvertently moving nodes

    // metadata for current graph
    about: state => state.about,

    // basic generic graph structure elements
    nodes: state => Object.values(state.nodes).filter(n => n),  // filters out nulls (deleted items)
    edges: state => Object.values(state.edges).filter(e => e),  // filters out nulls (deleted items)
    isNode: state => id => Object.hasOwn(state.nodes, id),      // validate a node identifier   
    isEdge: state => id => Object.hasOwn(state.edges, id),      // validate an edge identifier  
    nodeByID: state => id => state.nodes[id] || null,           // get node from identifier
    edgeByID: state => id => state.edges[id] || null,           // get edge from identifier

    edgesBySource: (state, getters) => source => getters.edges.filter(e => e.data.source === source),
    edgesByTarget: (state, getters) => target => getters.edges.filter(e => e.data.target === target),

    // node subsets - filtered by class
    phases: (state, getters) => getters.nodes.filter(node => node.data.class === NodeClass.PHASE),
    groups: (state, getters) => getters.nodes.filter(node => node.data.class === NodeClass.GROUP),
    subgroups: (state, getters) => getters.nodes.filter(node => node.data.class === NodeClass.SUBGROUP),
    contexts: (state, getters) => getters.nodes.filter(node => node.data.class  === NodeClass.CONTEXT),
    datings: (state, getters) => getters.nodes.filter(node => node.data.class  === NodeClass.DATING),
    periods: (state, getters) => getters.nodes.filter(node => node.data.class === NodeClass.PERIOD),

    // labels as used in lookups
    labelByID: (state, getters) => (id, includeClass=false) => {
        if(getters.isNode(id)) {
            let node = getters.nodeByID(id)
            return getters.nodeLabel(node, includeClass)
        }
        else if(getters.isEdge(id)) { 
            let edge = getters.edgeByID(id)       
            return getters.edgeLabel(edge, includeClass)
        }
        else return ""
    },
    nodeLabel: () => (node, includeClass=false) => {
        if(!node) return ""
        let nodeLabel = clean(node.data?.label) 
        if(includeClass) {
            let nodeClass = clean(node.data?.class)
            return `(${nodeClass}) ${nodeLabel}`
        }
        else
            return nodeLabel
    },
    edgeLabel: (state, getters) => (edge, includeClass=false) => {        
        if(!edge) return ""
        let sourceLabel = getters.labelByID(edge.data?.source, includeClass) 
        let targetLabel = getters.labelByID(edge.data?.target, includeClass) 
        let connection = clean(edge.data?.type)
        return `${sourceLabel} ${connection} ${targetLabel}`        
        
    },
    classByID: (state, getters) => (id) => {
        if(getters.isNode(id)) {
            let node = getters.nodeByID(id)
            return node?.data?.class || ""
        }
        else if(getters.isEdge(id)) { 
            return EdgeClass.EDGE
        }
        else return ""
    },

    // whether node with given ID has any descendant dating records (used for colour coding in diagram)
    // and whether any of those dating records are marked as 'included'
    hasDating: (state, getters) => id => getters.descendantsOfID(id)
        .filter(n => n.data.class === NodeClass.DATING && n.data.included).length > 0,
    // if it's a context we can just check the dating records directly - should be faster...
    contextHasDating: (state, getters) => id => getters.datings.filter(n => n.data.included && n.data.parent == id).length > 0,

    // options for populating lookup controls    
    groupTypeOptions: () => typeOptions(state.types.groupTypes),
    contextTypeOptions: () => typeOptions(state.types.contextTypes),
    datingTypeOptions: () => typeOptions(state.types.datingTypes),
    
    // option lists for element selectors
    //nodeOptions: (state, getters) => nodes => nodes
        //.map(n => { return { value: n.data.id, text: `(${n.data.class}) ${n.data.label}` }})
        //.sort((a, b) => a.text > b.text ? 1 : -1),
    phaseOptions: (state, getters) => getters.phases
        .map(n => { return { value: n.data.id, text: getters.nodeLabel(n, true) }})
        .sort(nodeOptionSort), //nodeOptions(getters.phases),
    groupOptions: (state, getters) => getters.groups
        .map(n => { return { value: n.data.id, text: getters.nodeLabel(n, true) }})
        .sort(nodeOptionSort), //nodeOptions(getters.groups),
    subgroupOptions: (state, getters) => getters.subgroups
        .map(n => { return { value: n.data.id, text: getters.nodeLabel(n, true) }})
        .sort(nodeOptionSort), //nodeOptions(getters.subgroups),
    contextOptions: (state, getters) => getters.contexts
        .map(n => { return { value: n.data.id, text: getters.nodeLabel(n, true) }})
        .sort(nodeOptionSort), //nodeOptions(getters.contexts),
    periodOptions: (state, getters) => getters.periods
        .map(n => { return { value: n.data.id, text: n.data.label }})
        .sort(nodeOptionSort), //nodeOptions(getters.periods),
    
        // grouped option lists for element selectors
    phaseOptionsGrouped: (state, getters) => (getters.phaseOptions.length == 0) ? 
        [] : [{ label: "Phases", options: getters.phaseOptions }],           
    groupOptionsGrouped: (state, getters) => (getters.groupOptions.length == 0) ? 
        [] : [{ label: "Groups", options: getters.groupOptions }],            
    subgroupOptionsGrouped: (state, getters) => (getters.subgroupOptions.length == 0) ? 
        [] : [{ label: "Subgroups", options: getters.subgroupOptions }],            
    contextOptionsGrouped: (state, getters) => (getters.contextOptions.length == 0) ? 
        [] : [{ label: "Contexts", options: getters.contextOptions }],
    periodOptionsGrouped: (state, getters) => (getters.periodOptions.length == 0) ? 
        [] : [{ label: "Periods", options: getters.periodOptions }],
        
    // context parent could be a subgroup, group or phase. 
    // May have the same label, so grouped to disambiguate
    contextParentOptions: (state, getters) => [
        ...getters.phaseOptionsGrouped,
        ...getters.groupOptionsGrouped,
        ...getters.subgroupOptionsGrouped
    ],         

    // hierarchical selectors
    childrenOfIDs: (state, getters) => ids => getters.nodes.filter(n => ids.includes(n.data.parent)),
    childrenOfID: (state, getters) => id => getters.nodes.filter(n => n.data.parent == id),
    
    // not sure if required yet..
    //childrenOfNode: (state, getters) => node => getters.nodes.filter(n => n.data.parent == node.data.id),
    //descendantsOfNode

    descendantsOfIDs: (state, getters) => ids => {
        let descendants = []
        let childNodes = getters.childrenOfIDs(ids)
        let iteration = 0 // to break possible self referential loops
        while(childNodes.length > 0 && iteration < 5) {
            descendants.push(...childNodes)
            childNodes = getters.childrenOfIDs(childNodes.map(n => n.data.id))
            iteration++
        }
        return descendants
    },
    descendantsOfID: (state, getters) => id => getters.descendantsOfIDs([id]),

    ancestorsOfID: (state, getters) => id => {
        let node = getters.nodeByID(id)
        return getters.ancestorsOfNode(node)
    },
    ancestorsOfNode: (state, getters) => node => {
        let ancestors = []
        let iteration = 0 // to break possible self referential loops
        
        if(!node) return []
        let parent = getters.nodeByID(node.data?.parent)

        while(parent && iteration < 5) { 
            ancestors.push(parent)
            parent = getters.nodeByID(parent.data?.parent)
            iteration++   
        }
        return ancestors
    },
    

    // hierarchically derived stratigraphic links between elements
    derivedEdges: (state, getters) => {
        
        const newEdges = new Map()
        getters.edges.filter(edge => edge.data.type == EdgeType.ABOVE).forEach(edge => {
            // get ancestry of source and target nodes (as sets of IDs)
            let sourceAncestry = new Set(getters.ancestorsOfID(edge.data.source).map(node => node.data.id))
            let targetAncestry = new Set(getters.ancestorsOfID(edge.data.target).map(node => node.data.id))

            // add source and target IDs themselves
            sourceAncestry.add(edge.data.source)
            targetAncestry.add(edge.data.target)

            // remove any IDs the 2 lists have in common
            sourceAncestry.forEach(id => {
                if(targetAncestry.has(id))
                    sourceAncestry.delete(id)
                    targetAncestry.delete(id)
            })

            // generate links - all elements in sourceAncestry 
            // are 'above' all elements in targetAncestry 
            sourceAncestry.forEach(sourceID => {
                targetAncestry.forEach(targetID => {
                    let edgeID = `edge-${utf8_to_hex(sourceID)}-${utf8_to_hex(targetID)}`
                    if(!newEdges.has(edgeID)) {
                        newEdges.set(edgeID, { 
                            data: { 
                                id: edgeID, 
                                source: sourceID, 
                                target: targetID, 
                                type: EdgeType.ABOVE
                            }
                        })
                    }
                })
            })
        })
        return [...newEdges.values()]
    },

    //datingsForID: (state, getters) => id => getters.descendantsOfID(id)
        //.filter(n => n.data.class == NodeClass.DATING && n.data.included), 
        
    // get actual min/max years accounting for any tolerance set
    enteredDatesForID: (state, getters) => id => {
        let node = getters.nodeByID(id)
        return getters.enteredDatesForNode(node)
    },
    enteredDatesForNode: () => node => {        
        // get cleaned dating values
        let dating = node?.data?.dating || {}
        let cleaned = {
            minYear: Number(dating.minYear || Number.POSITIVE_INFINITY),
            maxYear: Number(dating.maxYear || Number.NEGATIVE_INFINITY),
            minYearTolValue: Number(dating.minYearTolValue || 0),
            maxYearTolValue: Number(dating.maxYearTolValue || 0),
            minYearTolUnit: (dating.minYearTolUnit || "years").trim().toLowerCase(),
            maxYearTolUnit: (dating.maxYearTolUnit || "years").trim().toLowerCase()
        }
        // apply minYear tolerance (if present)
        if(cleaned.minYear < Number.POSITIVE_INFINITY && cleaned.minYearTolValue !== 0) {
            if(cleaned.minYearTolUnit == "percent") 
                cleaned.minYear -= (cleaned.minYear * (cleaned.minYearTolValue / 100))
            else
                cleaned.minYear -= cleaned.minYearTolValue
        }

        // apply maxYear tolerance (if present)
        if(cleaned.maxYear > Number.NEGATIVE_INFINITY && cleaned.maxYearTolValue !== 0) {
            if(cleaned.maxYearTolUnit == "percent") 
                cleaned.maxYear += (cleaned.maxYear * (cleaned.maxYearTolValue / 100)) 
            else
                cleaned.maxYear += cleaned.maxYearTolValue
        }

        // return overall rounded minYear/maxYear values after tolerances applied
        return { 
            minYear: cleaned.minYear < Number.POSITIVE_INFINITY ? Math.round(cleaned.minYear) : null, 
            maxYear: cleaned.maxYear > Number.NEGATIVE_INFINITY ? Math.round(cleaned.maxYear) : null
        }  
    },

    // derive min/max years from hierarchical descendant datings
    derivedDates: (state, getters) => id => {
        if(getters.isNode(id))
            return getters.derivedNodeDates(id)
        else if(getters.isEdge(id))
            return getters.derivedEdgeDates(id)
        else 
            return { minYear: null, maxYear: null }
    },

    derivedEdgeDates: (state, getters) => id => {
        let edge = getters.edgeByID(id)
        if(!edge) 
            return { minYear: null, maxYear: null }
            
        let sourceDates = getters.derivedNodeDates(edge.data.source)
        let targetDates = getters.derivedNodeDates(edge.data.target)      
        
        return { 
            minYear: targetDates.maxYear ? targetDates.maxYear + 1: null, 
            maxYear: sourceDates.minYear ? sourceDates.minYear - 1: null
        }
    },

    derivedNodeDates: (state, getters) => id => {
        let minYear = Number.POSITIVE_INFINITY
        let maxYear = Number.NEGATIVE_INFINITY
        
        getters.descendantsOfID(id)
            .filter(n => n.data.class == NodeClass.DATING && n.data.included && n.data.dating)
            //.map(n => ((n || {}).data || {}).dating)
            //.filter(dating => dating) 
            .forEach(n => {
                // extents of date range, accounting for any tolerance set
                let dating = getters.enteredDatesForNode(n)                    
                // less than the current minimum?
                if(dating.minYear < minYear) minYear = dating.minYear
                // more than the current maximum?
                if(dating.maxYear > maxYear) maxYear = dating.maxYear
            })
        // return overall rounded min/max year after tolerances applied
        return { 
            minYear: minYear < Number.POSITIVE_INFINITY ? Math.round(minYear) : null, 
            maxYear: maxYear > Number.NEGATIVE_INFINITY ? Math.round(maxYear) : null
        }
    },            

    // duration for derived dates (accounting for any tolerance set)
    derivedDuration: (state, getters) => id => { 
        let dates = getters.derivedDates(id)
        return (dates.maxYear !== null && dates.minYear !== null) ? (dates.maxYear - dates.minYear) + 1 : null
    },

    derivedMinDuration: (state, getters) => id => { 
        let edge = getters.edgeByID(id)
        if(!edge) 
            return { minYear: null, maxYear: null }
            
        let sourceDates = getters.derivedNodeDates(edge.data.source)
        let targetDates = getters.derivedNodeDates(edge.data.target) 

        return (sourceDates.minYear !== null && targetDates.maxYear !== null) ? (sourceDates.minYear - targetDates.maxYear) : null
        
    },
    derivedMaxDuration: (state, getters) => id => { 
        let edge = getters.edgeByID(id)
        if(!edge) 
            return { minYear: null, maxYear: null }
            
        let sourceDates = getters.derivedNodeDates(edge.data.source)
        let targetDates = getters.derivedNodeDates(edge.data.target)  

        return (sourceDates.maxYear !== null && targetDates.minYear !== null) ? (sourceDates.maxYear - targetDates.minYear) : null
    },

    // duration for entered dates (accounting for any tolerance set)
    enteredDuration: (state, getters) => id => { 
        let dates = getters.enteredDatesForID(id)
        return (dates.maxYear !== null && dates.minYear !== null) ? (dates.maxYear - dates.minYear) + 1 : null
    }, 

    newPhase: (state, getters) => () => { 
        const nc = NodeClass.PHASE
        const id = _uniqueId()
        
        // structure of a new phase
        return { 
            data: {
                siteCode: "", 
                id: `${nc}-${id}`, 
                class: nc, 
                label: id,
                period: "", 
                description: "",
                dating: {
                    label: "",
                    minYear: null,
                    maxYear: null,
                    minYearTolValue: 0,
                    maxYearTolValue: 0,
                    minYearTolUnit: "years",
                    maxYearTolUnit: "years"                        
                } 
            }, 
            position: { x: 0, y: 0 } 
        }
    },

    newGroup: (state, getters) => () => { 
        const nc = NodeClass.GROUP
        const id = _uniqueId()
        
        // structure of a new group
        return { 
            data: {
                siteCode: "",  
                id: `${nc}-${id}`, 
                class: nc, 
                label: id, 
                period: "", 
                description: "",
                parent: "", 
                type: "", 
                cud: "",               
            }, 
            position: { x: 0, y: 0 }
        }
    },
    
    newSubGroup: (state, getters) => () => { 
        const nc = NodeClass.SUBGROUP
        const id = _uniqueId()
        
        // structure of a new subgroup
        return { 
            data: {
                siteCode: "",  
                id: `${nc}-${id}`, 
                class: nc, 
                label: id,                 
                period: "", 
                parent: "", 
                type: "",
                cud: "",  
                description: ""                    
            }, 
            position: { x: 0, y: 0 }
        }
    },

    newContext: (state, getters) => () => { 
        const nc = NodeClass.CONTEXT
        const id = _uniqueId()
        
        // structure of a new context
        return { 
            data: { 
                siteCode: "", 
                id: `${nc}-${id}`, 
                class: nc, 
                label: id,
                period: "",
                parent: "", 
                type: "",
                cud: "",  
                description: ""                    
            }, 
            position: { x: 0, y: 0 }
        }
    },

    newDating: (state, getters) => () => { 
        const nc = NodeClass.DATING
        const id = _uniqueId()
        
        // structure of a new dating
        return { 
            data: { 
                siteCode: "", 
                id: `${nc}-${id}`, 
                class: nc, 
                label: id, 
                period: "",
                parent: "",
                type: "",                    
                description: "",
                included: true,
                association: "direct",
                dating: {
                    label: "",
                    minYear: null,
                    maxYear: null,
                    minYearTolValue: 0,
                    maxYearTolValue: 0,
                    minYearTolUnit: "years",
                    maxYearTolUnit: "years"
                }  
            }
        } 
    },

    newPeriod: (state, getters) => () => { 
        const nc = NodeClass.PERIOD
        const id = _uniqueId()
        
        // structure of a new dating
        return { 
            data: { 
                id: `${nc}-${id}`, 
                class: nc, 
                label: id, 
                uri: "",
                description: "",
                dating: {
                    label: "",
                    minYear: null,
                    maxYear: null,
                    minYearTolValue: 0,
                    maxYearTolValue: 0,
                    minYearTolUnit: "years",
                    maxYearTolUnit: "years"
                }  
            }
        } 
    },

    newEdge: (state, getters) => () => {
        const id = _uniqueId()
        
        // structure of a new edge
        return { 
            data: { 
                siteCode: "", 
                id: `${EdgeClass.EDGE}-${id}`,  // "edge-123"
                class: EdgeClass.EDGE,          // "edge" 
                source: "", 
                target: "", 
                type: EdgeType.ABOVE            // "above"
            } 
        }
    }
}

const actions = {
    // loadContextTypes(){}, // [part of config?]
    // loadGroupTypes(){},   // [part of config?] 
	
    async loadMatrixData({commit, getters, dispatch}, data) {
        // actions are asynchronous so ensure 
        // clear is complete before proceeding
        await dispatch('clearAll', commit)
        
        // store any metadata present
        let about = data.about || {}
        commit('SET_ABOUT', about)

        // cytoscape format = { elements: { nodes:[], edges:[] } }
        let elements = data.elements ? data.elements : data // for legacy structure
        let nodes = elements.nodes || []
        let edges = elements.edges || []
        
        const newNodes = nodes.map(node => {
            let newItem = null
            let nc = node.data?.class || ""            
            switch(nc) {
                case NodeClass.PHASE: newItem = getters.newPhase();break;
                case NodeClass.GROUP: newItem = getters.newGroup();break;
                case NodeClass.SUBGROUP: newItem = getters.newSubGroup();break;
                case NodeClass.CONTEXT: newItem = getters.newContext();break;
                case NodeClass.DATING: newItem = getters.newDating();break;
                case NodeClass.PERIOD: newItem = getters.newPeriod();break;
                default: break;                
            }
            //return(newItem ? _merge({}, newItem, node) : null)
            return(newItem ? _merge(newItem, node) : null)
        }).map(node => node)
        
        const newEdges = edges.map(edge => _merge(getters.newEdge(), edge))
        
        commit('BULK_LOAD_ELEMENTS', { nodes: newNodes, edges: newEdges })         
    },
    //saveMatrixData(){},

    clearAll({commit}) {
        // mutations are synchronous so this is OK
        commit('SET_ABOUT', { title: "", description: "", creator: "", contact: "", license: "", version: ""})
        commit('DELETE_NODES')
        commit('DELETE_EDGES')
        Promise.resolve() // See https://blog.usejournal.com/vue-js-best-practices-c5da8d7af48d
    },
    // update mutation will insert if node doesn't exist        
    insertNode({commit, dispatch}, node) { 
        commit('UPDATE_NODE', node)
        //dispatch('setSelectedID', node.data.id, commit)  // not working?    
        Promise.resolve()       
    },
    insertNodes({commit}, nodes) {
        nodes.forEach(node => commit('UPDATE_NODE', node))
        Promise.resolve() 
    },
	updateNode({commit}, node) {
		commit('UPDATE_NODE', node)
	},
    // this is only called from MatrixDiagram; 
    // it should ONLY update the node POSITION
    updateNodePosition({commit, getters}, node) {
        let existing = getters.nodeByID(node?.data?.id)
              
        if(existing) {            
            // can't update existing as it's frozen
            const newNode = Object.assign({}, existing)
            newNode.position = node.position            
            commit('UPDATE_NODE', newNode)
        }
        Promise.resolve() 
    },
    setSelectedID({commit}, id) {
        commit('SET_SELECTED_ID', id)
    },
    setDiagramLock({commit}, value){
        commit('SET_DIAGRAM_LOCK', value)
    },
	deleteNode({commit, getters}, node) {
        // set 'parent' of any children to null 
        // so we no longer reference this node
        getters.childrenOfID(node.data.id).forEach(node => {
            const newNode = Object.assign({}, node)
            newNode.data.parent = null
            commit('UPDATE_NODE', newNode) 
        })

        // delete any incoming or outgoing edges
        let outgoing = getters.edgesBySource(node.data.id)
        let incoming = getters.edgesByTarget(node.data.id)
        outgoing.concat(incoming).forEach(edge => commit('DELETE_EDGE', edge))

        // now delete the node itself
		commit('DELETE_NODE', node)        
    },         
    createEdge({commit, dispatch, getters}) {
        let edge = getters.newEdge()
        dispatch('insertEdge', edge, commit)  
    },
    insertEdge({commit, getters}, edge) {
        // ensure item to add has all required properties  
        //let newEdge = _merge(getters.newEdge(), edge)
        commit('UPDATE_EDGE', edge)            
    },
    insertEdges({commit, dispatch}, edges) {
        edges.forEach(edge => dispatch('insertEdge', edge, commit))	
        Promise.resolve() 
    },
	updateEdge({commit}, edge) {
		commit('UPDATE_EDGE', edge)
	},
	deleteEdge({commit}, edge) {
		commit('DELETE_EDGE', edge)
    }    
}

const mutations = { 
    // make changes to the 'about' state
    SET_ABOUT(state, about) {
        // merge new data with existing state
        const newValue = Object.assign({}, state.about, about)
        state.about = Object.freeze(newValue)
    },    
    // currently selected node ID - for visual indication
    SET_SELECTED_ID(state, id) {
        state.selectedID = id || ""
    },
    SET_DIAGRAM_LOCK(state, value) {
        state.diagramLock = value
    },
    // for bulk data imports - faster
    BULK_LOAD_ELEMENTS: (state, elements) => {
        let newNodes = {}; // Object.assign({}, state.nodes);
        let newEdges = {}; // Object.assign({}, state.edges);

        (elements.nodes || []).forEach(node => {            
            const id = node?.data?.id || null
            if(id !== null) {
                Object.freeze(node)
                newNodes[id] = node
            }      
        });
        
        (elements.edges || []).forEach(edge => {
            const id = edge?.data?.id || null
            if(id !== null) {
                Object.freeze(edge)
                newEdges[id] = edge
            }  
        });
        //console.log(`BULK_LOAD_ELEMENTS: built edges`)
        //console.log(newNodes)
        Vue.set(state, "nodes", newNodes) 
        //console.log(`BULK_LOAD_ELEMENTS: nodes set`)
        Vue.set(state, "edges", newEdges)
        //console.log(`BULK_LOAD_ELEMENTS: edges set`)
    },

    UPDATE_NODE: (state, node) => {
        const id = node?.data?.id || null        
        if(id !== null) {
            // https://medium.com/@jiihu/how-to-improve-performance-of-vuex-store-c9e3cfb01f72
            const newNode = Object.assign({}, node)
            Object.freeze(newNode)
            // Vue.set ensures reactivity
            Vue.set(state.nodes, id, newNode)
        }
    },
    DELETE_NODE: (state, node) => {
        const id = node?.data?.id || null
        if(id !== null) {
        //if(Object.hasOwn(state.nodes, id)) { // maybe don't need to check this?
            // Vue.set ensures reactivity    
            Vue.set(state.nodes, id, null)   
        }    
    },
    DELETE_NODES(state) {
        state.nodes = {}
    },     
    UPDATE_EDGE(state, edge) {
        const id = edge?.data?.id || null
        if(id !== null) {
            // https://medium.com/@jiihu/how-to-improve-performance-of-vuex-store-c9e3cfb01f72
            const newEdge = Object.assign({}, edge)
            Object.freeze(newEdge)
            // Vue.set ensures reactivity
            Vue.set(state.edges, id, newEdge) 
        }         
    },
    DELETE_EDGE(state, edge) {
        const id = edge?.data?.id || null
        if(id !== null) {
        //if(Object.hasOwn(state.edges, id)) { // maybe don't need to check this?
            // Vue.set ensures reactivity
            Vue.set(state.edges, id, null)      
        }  
    },
    DELETE_EDGES(state) {
        state.edges = {}
    }		       
}

//export default createStore({
export default new Vuex.Store({
    //plugins,
    state,
    getters,
    actions,
    mutations
})