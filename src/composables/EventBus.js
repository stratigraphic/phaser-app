// EventBus used to communicate directly between components 
// usage: import EventBus from '@/composables/EventBus.js'
// event sender: EventBus.$emit("my-event-name")
// event receiver: EventBus.$on("my-event-name", () => doSomething())
import Vue from 'vue'
const EventBus = new Vue()
export default EventBus