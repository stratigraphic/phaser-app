<template>
	<b-modal v-once centered id="modalAbout" :title="`About ${ store.getters.appName }`">
		<div class="text-center">
			<img src="phaser-spacedout-logo.png" width="444" height="118" class="mb-3">
			<p>Version {{ store.getters.appVersion }}</p>				
			<p>A stratigraphic matrix editing tool</p>
			<p>Created as part of the MATRIX project</p>
			<a target="_blank" href="https://stratigraphic.github.io/matrix/">https://stratigraphic.github.io/matrix/</a>
		</div>
		<!--this removes default buttons from b-modal-->
		<template #modal-footer><div></div></template>
	</b-modal>	
</template>
<script>
import { inject } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
export default {
	setup() {
		const store = inject('store')		
		return { store }
	}
}
</script>