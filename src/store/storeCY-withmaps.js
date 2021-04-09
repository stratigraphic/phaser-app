import Vue from "vue"
import Vuex from "vuex"

// import VuexPersist from 'vuex-persist'
import createPersistedState from "vuex-persistedstate"
import _merge from "lodash/merge"
import {NodeClass} from "@/mixins/constants.js"

Vue.use(Vuex)

/*
const vuexLocalStorage = new VuexPersist({
    key: 'vuex', // The key to store the state on in the storage provider.
    storage: window.localStorage // or window.sessionStorage or localForage
})
*/

export default new Vuex.Store({
	// strict: true,
    // plugins: [vuexLocalStorage.plugin],
    plugins: [ createPersistedState({ storage: window.localStorage }) ],
	state: {
        appName: "Phaser",  // application name
        appVersion: "1.1",  // application version
        selectedID: "",     // ID of currently selected node        
        about: {            // not used yet..
            project: "My example project",
            descrip: "VUEX store data for Cytoscape graph elements structure",
            creator: "Ceri Binding, University of South Wales",
            contact: "ceri.binding@southwales.ac.uk",
            created: "2021-01-07",
            updated: "2021-01-07", 
            version: "1.0",           
        },  
        graph: {
            nodeMap: new Map(),
            edgeMap: new Map(),
            //nodes: [],
            //edges: []
        }, 
        types: {            
            groupTypes: [
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
            contextTypes: [ // TODO: load from external JSON. Part of config?
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
            /*findTypes: [
                "find type A",
                "find type B",
                "find type C"
            ],
            sampleTypes: [
                "sample type A",
                "sample type B",
                "sample type C"
            ],*/
            datingTypes: [
                "find",
                "sample",
                "manual"
            ],
            periodTypes: [
                { id: "1", label: "Roman", min: 43, max: 410 },
                { id: "1", label: "Medieval", min: 1066, max: 1540 },
            ]         
        }     
    },	
    
	getters: { 
        appName: state => state.appName, // application name
        appVersion: state => state.appVersion, // application version
        about: state => state.about, // metadata about this graph (not used yet)        
        
        // basic elements of graph structure 
        //elements: state => state.graph, 
        nodeMap: state => state.graph.nodeMap,
        nodes: (state, getters) => getters.nodeMap.values(),
        edges: state => Array.from(state.graph.edgeMap.values()),    
        isNode: state => id => state.graph.nodeMap.has(id),     
        isEdge: state => id => state.graph.edgeMap.has(id), 
        nodeByID: state => id => state.graph.nodeMap.get(id),
        edgeByID: state => id => state.graph.edgeMap.get(id), 

        //nodeLabel: (state, getters) => id => ((getters.nodeByID(id) || {}).data || {}).label || id,
        nodeLabel: (state, getters) => (id, includeClass=false) => {
            let node = getters.nodeByID(id)
            if(node) {
                let nodeLabel = node.data?.label || id 
                let nodeClass = node.data?.class || "node"
                return includeClass ? `(${nodeClass}) ${nodeLabel}` : nodeLabel
            }
            else return ""
        },
        edgesBySource: (state, getters) => source => getters.edges.filter(e => e.data.source === source),
        edgesByTarget: (state, getters) => target => getters.edges.filter(e => e.data.target === target),

        // specialized elements of graph structure
        phases: (state, getters) => getters.nodes.filter(n => n.data.class === NodeClass.PHASE),
		groups: (state, getters) => getters.nodes.filter(n => n.data.class === NodeClass.GROUP),
        subgroups: (state, getters) => getters.nodes.filter(n => n.data.class === NodeClass.SUBGROUP),
        contexts: (state, getters) => getters.nodes.filter(n => n.data.class === NodeClass.CONTEXT),
        datings: (state, getters) => getters.nodes.filter(n => n.data.class === NodeClass.DATING),

        // currently selected node ID - for UI
        selectedID: state => state.selectedID,

        // options for lookup controls        
        //phaseTypes: state => state.types.phaseTypes,
        //groupTypes: state => state.types.groupTypes,
        //contextTypes: state => state.types.contextTypes,        
        //findTypes: state => state.types.findTypes,
        //sampleTypes: state => state.types.sampleTypes,
        phaseTypeOptions: state => state.types.phaseTypes.map(s => { return { value: s, text: s }}),
        groupTypeOptions: state => state.types.groupTypes.map(s => { return { value: s, text: s }}),
        contextTypeOptions: state => state.types.contextTypes.map(s => { return { value: s, text: s }}),
        datingTypeOptions: state => state.types.datingTypes.map(s => { return { value: s, text: s }}),
        
        // option lists for element selectors
        phaseOptions: (state, getters) => getters.phases
            .map(n => { return { value: n.data.id, text: `(phase) ${n.data.label}` }})
            .sort((a, b) => (a.text || "") - (b.text || "")),
        groupOptions: (state, getters) => getters.groups
            .map(n => { return { value: n.data.id, text: `(group) ${n.data.label}` }})
            .sort((a, b) => (a.text || "") - (b.text || "")),
        subgroupOptions: (state, getters) => getters.subgroups
            .map(n => { return { value: n.data.id, text: `(subgroup) ${n.data.label}` }})
            .sort((a, b) => (a.text || "") - (b.text || "")),
        contextOptions: (state, getters) => getters.contexts
            .map(n => { return { value: n.data.id, text: `(context) ${n.data.label}` }})
            .sort((a, b) => (a.text || "") - (b.text || "")),                  
        
            // grouped option lists for element selectors
        phaseOptionsGrouped: (state, getters) => (getters.phaseOptions.length == 0) ? 
            [] : [{ label: "Phases", options: getters.phaseOptions }],           
        groupOptionsGrouped: (state, getters) => (getters.groupOptions.length == 0) ? 
            [] : [{ label: "Groups", options: getters.groupOptions }],            
        subgroupOptionsGrouped: (state, getters) => (getters.subgroupOptions.length == 0) ? 
            [] : [{ label: "Subgroups", options: getters.subgroupOptions }],            
        contextOptionsGrouped: (state, getters) => (getters.contextOptions.length == 0) ? 
            [] : [{ label: "Contexts", options: getters.contextOptions }],
            
        // context parent could be subgroup, group or phase. May have same label, so grouping options to disambiguate
        contextParentOptions: (state, getters) => [
            ...getters.phaseOptionsGrouped,
            ...getters.groupOptionsGrouped,
            ...getters.subgroupOptionsGrouped
        ],         

        // hierarchical querying functionality
        childrenOfIDs: (state, getters) => ids => getters.nodes.filter(n => ids.includes(n.data.parent)),
        childrenOfID: (state, getters) => id => getters.childrenOfIDs([id]),    
        
        descendantsOfIDs: (state, getters) => ids => {
            let descendants = []
            let childNodes = getters.childrenOfIDs(ids)
            let iteration = 0 // to break self referential loops
            while(childNodes.length > 0 && iteration < 5) {
                descendants = descendants.concat(childNodes)
                childNodes = getters.childrenOfIDs(childNodes.map(n => n.data.id))
                iteration++                
            }           
            return descendants
        },
        descendantsOfID: (state, getters) => id => getters.descendantsOfIDs([id]),
        
        //datingsForID: (state, getters) => id => getters.descendantsOfID(id)
            //.filter(n => n.data.class == NodeClass.DATING && n.data.included),        

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
            let sourceDates = getters.derivedDates(edge.data.source)
            let targetDates = getters.derivedDates(edge.data.target)      
            
            return { 
                minYear: targetDates.maxYear ? targetDates.maxYear : null, 
                maxYear: sourceDates.minYear ? sourceDates.minYear : null
            }
        },
        derivedNodeDates: (state, getters) => id => {
            let minYear = Number.MAX_VALUE
            let maxYear = Number.MIN_VALUE
            
            getters.descendantsOfID(id)
                .filter(n => n.data.class == NodeClass.DATING && n.data.included && n.data.dating)
                .map(n => ((n || {}).data || {}).dating)
                //.filter(dating => dating) 
                .forEach(d => {
                    let clean = {
                        minYear: Number(d.minYear),
                        maxYear: Number(d.maxYear),
                        minYearTolValue: Number(d.minYearTolValue),
                        maxYearTolValue: Number(d.maxYearTolValue),
                        minYearTolUnit: d.minYearTolUnit,
                        maxYearTolUnit: d.maxYearTolUnit
                    }
                    
                    // apply minYear tolerance (if present)
                    if(clean.minYearTolUnit == "percent") 
                        clean.minYear -= (clean.minYear * (clean.minYearTolValue / 100))
                    else
                        clean.minYear -= clean.minYearTolValue

                    // apply maxYear tolerance (if present)
                    if(clean.maxYearTolUnit == "percent") 
                        clean.maxYear += (clean.maxYear * (clean.maxYearTolValue / 100)) 
                    else
                        clean.maxYear += clean.maxYearTolValue 

                    // less than the current minimum?
                    if(clean.minYear < minYear) minYear = clean.minYear
                    // more than the current maximum?
                    if(clean.maxYear > maxYear) maxYear = clean.maxYear
                })
            // return overall rounded min/max year after tolerances applied
            return { 
                minYear: minYear < Number.MAX_VALUE ? Math.round(minYear) : null, 
                maxYear: maxYear > Number.MIN_VALUE ? Math.round(maxYear) : null
            }
        },
        duration: (state, getters) => id => { 
            let dates = getters.derivedDates(id)
            return (dates.maxYear && dates.minYear) ? (dates.maxYear - dates.minYear) + 1 : null
        },        
        
        newPhase: state => { 
            const nc = NodeClass.PHASE
            // get next available phase ID to use
            let nextID = 1
            while(state.graph.nodeMap.has(`${nc}-${nextID}`)) nextID++ 
            const id = `${nc}-${nextID}`
            // structure of a new phase
            return { 
                data: { 
                    id: id, 
                    class: nc, 
                    label: nextID.toString(), 
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
                position: { 
                    x: 0, 
                    y: 0 
                } 
            }
        },

        newGroup: state => { 
            const nc = NodeClass.GROUP
            // get next available group ID to use
            let nextID = 1
            while(state.graph.nodeMap.has(`${nc}-${nextID}`)) nextID++ 
            const id = `${nc}-${nextID}`
            // structure of a new group
            return { 
                data: { 
                    id: id, 
                    class: nc, 
                    parent: "", 
                    type: "",                    
                    label: nextID.toString(), 
                    description: ""
                }, 
                position: { 
                    x: 0, 
                    y: 0 
                } 
            }
        },

        newSubGroup: state => { 
            const nc = NodeClass.SUBGROUP
            // get next available subgroup ID to use
            let nextID = 1
            while(state.graph.nodeMap.has(`${nc}-${nextID}`)) nextID++ 
            const id = `${nc}-${nextID}`
            // structure of a new subgroup
            return { 
                data: { 
                    id: id, 
                    class: nc, 
                    parent: "", 
                    type: "",
                    label: nextID.toString(), 
                    description: ""                    
                }, 
                position: { 
                    x: 0, 
                    y: 0 
                } 
            }
        },

        newContext: state => { 
            const nc = NodeClass.CONTEXT
            // get next available context ID to use 
            let nextID = 1
            while(state.graph.nodeMap.has(`${nc}-${nextID}`)) nextID++ 
            const id = `${nc}-${nextID}`
            // structure of a new context
            return { 
                data: { 
                    id: id, 
                    class: nc, 
                    parent: "", 
                    type: "",
                    label: nextID.toString(),
                    description: ""                    
                }, 
                position: { 
                    x: 0, 
                    y: 0 
                } 
            }
        },
        
        newDating: state => { 
            const nc = NodeClass.DATING
            // get next available context ID to use 
            let nextID = 1
            while(state.graph.nodeMap.has(`${nc}-${nextID}`)) nextID++ 
            const id = `${nc}-${nextID}`
            // structure of a new dating
            return { 
                data: { 
                    id: id, 
                    class: nc, 
                    parent: "",
                    type: "",                    
                    label: nextID.toString(), 
                    description: "",
                    included: true,
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
                position: { 
                    x: 0, 
                    y: 0 
                }
            } 
        },

        newEdge: state => {
            // get next available edge ID to use 
            let nextID = 1            
            while(state.graph.edgeMap.has(`edge-${nextID}`)) nextID++ 
            const id = `edge-${nextID}` 
            // structure of a new edge
            return { data: { id: id, source: "source", target: "target", type: "above" } }
        }
    },
    
    // mutations are synchronous, keep them as short and simple as possible
	mutations: { 
        // performs an insert if the node doesn't exist       
        UPDATE_NODE(state, node) {
            //const nodes = state.graph.nodes
            //const index = nodes.findIndex(n => n.data?.id === node?.data?.id)  // check if id exists     
            //if(index === -1)            // id doesn't exist - add new node
                //nodes.push(node)          
            //else                        // id exists - update existing node
                //Vue.set(nodes, index, node) // see if this works better? trying to ensure reactivity of grouping
                //nodes.splice(index, 1, node)  // otherwise this will work.. replace the node  

            state.graph.nodeMap.set(node.data.id, node)

        },

        // currently selected node ID - for visual indication
        SELECT_ID(state, id) {
            state.selectedID = id || ""
        },

        DELETE_NODE(state, node) {
            //const nodes = state.graph.nodes
            //const index = nodes.findIndex(n => n.data.id === node?.data?.id)
            //if(index !== -1)                    // id exists
                //nodes.splice(index, 1)          // remove 
            state.graph.nodeMap.delete(node.data.id)
        },

        DELETE_NODES(state) {
            //state.graph.nodes = []
            state.graph.nodeMap.clear()
        }, 

        UPDATE_EDGE(state, edge) {
            //const edges = state.graph.edges
            //const index = edges.findIndex(e => e.data.id === edge?.data?.id)
            //if(index === -1)        // id doesn't exist - add new edge
                //edges.push(edge)               
            //else                    // id exists - update existing edge
                //Vue.set(edges, index, edge) // see if this works? trying to ensure reactivity of grouping
                //edges.splice(index, 1, edge)    // otherwise this will work.. replace the edge 
            state.graph.edgeMap.set(edge?.data?.id, edge)           
        },

        DELETE_EDGE(state, edge) {
            //const edges = state.graph.edges
            //const index = edges.findIndex(e => e.data.id === edge?.data?.id)
            //if(index !== -1)            // exists, remove 
               // edges.splice(index, 1)  // remove
            state.graph.edgeMap.delete(edge?.data?.id)
        },

        DELETE_EDGES(state) {
            //state.graph.edges = []
            state.graph.edgeMap.clear()
        }		
	},
	actions: {
        // loadContextTypes(){}, // [part of config?]
        // loadGroupTypes(){},   // [part of config?] 
	
        async loadMatrixData({commit, dispatch}, data){
            // actions are asynchronous so ensure order of actions
            await dispatch('clearAll', commit)

            // NEW: cytoscape format - {elements: {nodes:[],edges:[]}}
            let elements = data.elements ? data.elements : data

            let phases = (elements.nodes || []).filter(n => n.data.class == NodeClass.PHASE)
            let groups = (elements.nodes || []).filter(n => n.data.class == NodeClass.GROUP)
            let subgroups = (elements.nodes || []).filter(n => n.data.class == NodeClass.SUBGROUP)
            let contexts = (elements.nodes || []).filter(n => n.data.class == NodeClass.CONTEXT)
            let datings = (elements.nodes || []).filter(n => n.data.class == NodeClass.DATING)

            // not just insertNode, need to ensure each object has all required properties
            phases.forEach(item => dispatch('insertPhase', item, commit))
            groups.forEach(item => dispatch('insertGroup', item, commit))
            subgroups.forEach(item => dispatch('insertSubGroup', item, commit))
            contexts.forEach(item => dispatch('insertContext', item, commit))  
            datings.forEach(item => dispatch('insertDating', item, commit))       
            //await dispatch('insertNodes', data.nodes || [], commit)
            await dispatch('insertEdges', elements.edges || [], commit)
        },
        //saveMatrixData(){},

        clearAll({commit}) {
            // mutations are synchronous so this is OK
            commit('DELETE_NODES')
            commit('DELETE_EDGES')
            Promise.resolve() // See https://blog.usejournal.com/vue-js-best-practices-c5da8d7af48d
        },
        // update mutation will insert if node doesn't exist        
        insertNode({commit}, node) { 
            commit('UPDATE_NODE', node)            
        },
        insertNodes({commit}, nodes) {
            nodes.forEach(node => commit('UPDATE_NODE', node))
            Promise.resolve() 
        },
		updateNode({commit}, node) {
			commit('UPDATE_NODE', node)
		},
        setSelectedID({commit}, id) {
            commit('SELECT_ID', id)
        },
		deleteNode({commit, getters}, node) {
            // delete any incoming or outgoing edges
            let outgoing = getters.edgesBySource(node.data.id)
            let incoming = getters.edgesByTarget(node.data.id)
            outgoing.concat(incoming).forEach(edge => commit('DELETE_EDGE', edge))
            // now delete the node itself
			commit('DELETE_NODE', node)
        },
        
        createEdge({commit, dispatch, getters}) {
            let edge = getters.newEdge
             dispatch('insertEdge', edge, commit)  
        },
        insertEdge({commit, getters}, edge={}) {
            // ensure item to add has all required properties  
            let newEdge = _merge({}, getters.newEdge, edge)
            if(!newEdge.data.id) 
                newEdge.data.id = `edge-${newEdge.data.source || 'source'}-${newEdge.data.target || 'target'}`
            commit('UPDATE_EDGE', newEdge)            
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
        }, 

        insertPhase({commit, dispatch, getters}, item={}) {
            // ensure item to add has all required properties  
            let node = _merge({}, getters.newPhase, item)
            dispatch('insertNode', node, commit)  
        },
        insertGroup({commit, dispatch, getters}, item={}) {
            // ensure item to add has all required properties        
            let node = _merge({}, getters.newGroup, item)
            dispatch('insertNode', node, commit)  
        },
        insertSubGroup({commit, dispatch, getters}, item={}) {
            // ensure item to add has all required properties        
            let node = _merge({}, getters.newSubGroup, item)
            dispatch('insertNode', node, commit)  
        },        
        insertContext({commit, dispatch, getters}, item={}) {
            // ensure item to add has all required properties        
            let node = _merge({}, getters.newContext, item)
            dispatch('insertNode', node, commit)  
        },        
        insertDating({commit, dispatch, getters}, item={}) {
            // ensure item to add has all required properties        
            let node = _merge({}, getters.newDating, item)
            dispatch('insertNode', node, commit)  
        }  
	}	
})