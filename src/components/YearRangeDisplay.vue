<template>
    <span v-if="minYear !== null && maxYear !== null">
        <span>{{ minYear }}</span>
        <b-icon-arrow-right-short/>
        <span>{{ maxYear }}</span>
        <span v-if="showDuration" class="ml-1">{{ `(${duration})` }}</span>
    </span>
    <span v-else></span>
</template>
<script>
import { computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"

export default {
    props: {
        minYear: {
            type: Number,
            required: false,
            default: null
        },
        maxYear: {
            type: Number,
            required: false,
            default: null
        },
        showDuration: {
            type: Boolean,
            required: false,
            default: false
        }
    },
	setup(props) {
        const duration = computed(() => {
            if(props.minYear !== null && props.maxYear !== null) {
                // minYear and maxYear may be passed incorrectly!
                let min = Math.min(props.minYear, props.maxYear)                
                let max = Math.max(props.minYear, props.maxYear)
                return Math.abs(max - min) + 1 // TODO: adjust for 0 AD?
            }                
            else
                return 0
        }) 
		return { duration }
	}
}
</script>