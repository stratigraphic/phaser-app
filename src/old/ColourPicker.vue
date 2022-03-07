<template>
    <b-dropdown v-once split
        ref="colourPicker"
		size="md"
        class="shadow-sm p-0 m-0"
        name="colourPicker"
        :disabled="disabled"
        :value="selectedColour"
        variant="light">
        <template #button-content>
            <div class="px-4" 
                :style="`background: ${selectedColour}`">{{ label }}</div>
        </template>
        <b-container>        
            <b-row>
                <b-col v-for="colour in colours" 
                    :key="colour"  
                    :alt="colour" 
                    :title="colour"                  
                    class="m-0 px-4"
                    :style="`cursor: pointer; background: ${ colour }`"
                    @click="changed(colour)">&nbsp;</b-col>   
            </b-row>
        </b-container>
	</b-dropdown>	
</template>
<script>
import { ref } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
export default {
    props: {
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },
        label: {
            type: String,
			required: false,
			default: "select a colour",
        },
		colour: {
			type: String,
			required: false,
			default: "blue",
			//validator: value => colours.includes(value)   
		}
	},
	setup(props) {
        const colourPicker = ref(null)
        const selectedColour = ref(props.colour)
        const colours = ["salmon", "teal", "red", "orange", "yellow", "green", "blue", "violet", "pink"]

        const changed = (val) => {
            selectedColour.value = val
            colourPicker.value.hide()
        }

		return { colourPicker, colours, selectedColour, changed }
	}
}
</script>