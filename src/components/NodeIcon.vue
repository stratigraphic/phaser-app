<template>
    <span v-if="nodeClass !== ''" 
        :title="nodeClass" 
        :alt="nodeClass" 
        class="mr-1 p-0">        
        <svg :height="height" :width="width">
            <rect 
                :x="strokeWidth / 2" 
                :y="strokeWidth / 2" 
                :width="width - strokeWidth"  
                :height="height - strokeWidth" 
                :rx="3"
                :ry="3"
                :stroke-width="strokeWidth" 
                :fill="reversed ? fgColor : bgColor" 
                :stroke="fgColor"
                :stroke-dasharray="dashed ? '2 2' : ''"/>
            <text 
                x="50%"                
                :y="(height / 2) + (strokeWidth / 2)"  
                alignment-baseline="middle"  
                dominant-baseline="middle" 
                text-anchor="middle"
                :stroke="reversed ? bgColor : fgColor"
                :stroke-width="0.5" 
                :font-size="height - (strokeWidth * 4)">{{ iconText }}</text>      
        </svg>
    </span>
</template>
<script>
import { computed } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass, ElementColour } from '@/composables/PhaserCommon'

export default {
    props: {
        width: {
            type: Number,
            required: false,
            default: 16
        },
        height: {
            type: Number,
            required: false,
            default: 16
        },        
        nodeClass: {
            type: String,
            required: false,
			default: ""
        },
        dashed: {
            type: Boolean,
            required: false,
            default: false
        },      
        reversed: {
            type: Boolean,
            required: false,
            default: false
        },  
        selected: {
            type: Boolean,
            required: false,
            default: false
        },    
        label: {
            type: String,
            required: false,
			default: ""
        },
    },
	setup(props) {
		const strokeWidth = 2      
        
        const bgColor = computed(() => {
            // default white
            let color = ElementColour.CONTEXT_BG // "ghostwhite"

            // colour according to NodeClass
            switch(props.nodeClass) {
                case NodeClass.PHASE: color = ElementColour.PHASE_BG; break;
                case NodeClass.GROUP: color = ElementColour.GROUP_BG; break;
                case NodeClass.SUBGROUP: color = ElementColour.SUBGROUP_BG; break;
                case NodeClass.CONTEXT: color = ElementColour.CONTEXT_BG; break;
                case NodeClass.PERIOD: color = ElementColour.PERIOD_BG; break;
                case NodeClass.DATING: color = ElementColour.DATING_BG; break;           
            }

            // override color for selected node
            if(props.selected) 
                color = ElementColour.SELECTED_BG

            return color
        })

        const fgColor = computed(() => {
            // default black
            let color = ElementColour.CONTEXT_FG // "black"

            // colour according to NodeClass
            switch(props.nodeClass) {
                case NodeClass.PHASE: color = ElementColour.PHASE_FG; break;
                case NodeClass.GROUP: color = ElementColour.GROUP_FG; break;
                case NodeClass.SUBGROUP: color = ElementColour.SUBGROUP_FG; break;
                case NodeClass.CONTEXT: color = ElementColour.CONTEXT_FG; break;
                case NodeClass.PERIOD: color = ElementColour.PERIOD_FG; break;
                case NodeClass.DATING: color = ElementColour.DATING_FG; break;            
            }
            
            return color
        })

        const iconText = computed(() => {
            if(props.label)
                return props.label
            else if(props.nodeClass == NodeClass.PERIOD)
                return "T" // T=time-period (to distinguish from Phase)
            else
                return props.nodeClass.slice(0,1).toUpperCase() 
        })

        return { strokeWidth, fgColor, bgColor, iconText }
	}
}
</script>