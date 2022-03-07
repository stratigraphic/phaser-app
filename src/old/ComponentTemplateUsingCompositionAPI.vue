<template>
	<div><!--top level div will not be required in Vue3-->
		<h1>Counter</h1>
		<span>{{ counter }}</span>
		<button :disabled="isIncrementDisabled" @click="increment()">+1</button>
		<button :disabled="isDecrementDisabled" @click="decrement()">-1</button>
		<button :disabled="isResetDataDisabled" @click="resetdata()">Reset</button>
	</div>
</template>

<script>
import { 
	ref, 
	computed, 
	onBeforeMount, 
	onMounted, 
	onBeforeUpdate, 
	onUpdated, 
	onBeforeUnmount, 
	onUnmounted,
	onErrorCaptured,
	//onRenderTracked,
	//onRenderTriggered,
	onActivated,
	onDeactivated
} from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"

// declare functions that don't use instance outside of component declaration 
// (can also declare reusable functions in a separate module)
const clamp = (num, min, max) => Math.min(Math.max(num, min), max) 
	
export default {
	props: {
		def: { 
			required: false, 
			type: Number, 
			default: 5
		},
		min: { 
			required: false, 
			type: Number, 
			default: 0
		},
		max: { 
			required: false, 
			type: Number, 
			default: 10
		}
	},

	// executed before component creation, after props are resolved
	setup(props) {
		
		// reactive data value. Becomes ref object with 'value' property
		const counter = ref(clamp(props.def, props.min, props.max))		
		
		// computed properties 
		const isIncrementDisabled = computed(() => counter.value >= props.max)
		const isDecrementDisabled = computed(() => counter.value <= props.min)
		const isResetDataDisabled = computed(() => counter.value == props.def)
		
		// methods
		const increment = () => counter.value = clamp(counter.value + 1, props.min, props.max)
		const decrement = () => counter.value = clamp(counter.value - 1, props.min, props.max)
		const resetdata = () => counter.value = clamp(props.def, props.min, props.max)		
		const log = (message, persist = false) => {
			console.log(message)
			if(persist) {
				const key = "messages"
				// persistence mainly for testing lifecycle hooks...
				const oldMessages = JSON.parse(localStorage.getItem(key))
				const newMessages = (oldMessages || []).concat(message)
				localStorage.setItem(key, JSON.stringify(newMessages))
			}
		}

		// lifecycle hooks
		onBeforeMount(() => log('before mounted!', true))			
		onMounted(() => log('mounted!', true))
		onBeforeUpdate(() => log('before updated!', true))
		onUpdated(() => log('updated!', true))
		onBeforeUnmount(() =>log('before unmounted!', true))
		onUnmounted(() => log('unmounted!', true))
		onErrorCaptured(() => log('error captured!', true))
		//onRenderTracked(() => console.log('render tracked!'))
		//onRenderTriggered(() => console.log('render triggered!'))
		onActivated(() => log('activated!', true))
		onDeactivated(() => log('deactivated!', true))
		
		// returned data and functions are available to the template
		return {
			counter, 
			increment, 
			decrement, 
			resetdata,
			isIncrementDisabled,
			isDecrementDisabled,
			isResetDataDisabled
		}
	}
}
</script>
<style scoped>
span {
	color: blue;
	background: white;
}
</style>