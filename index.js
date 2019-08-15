import "./component.html";
import "./styles.less";

/**
 * Component to display text and turn it into editable textarea on click
 *
 * Usage:
 * {{> InlineTextEditComponent name value [allowReturn] [appendText [appendTextClass]]}}
 *
 * allowReturn - if true, component allows pressing Return
 * appendText - add text after the non-editable content
 * appendTextClass - the class of the span to be added
 *
 * On entry:
 * - sets "with-inline-editing" to the parent form
 *
 * On key press:
 * - sends submit() to parent form on Enter and closes the edit field
 * - sends reset() to paernt form on Escape and closes the edit field
 */

const currentTemplate = Template.InlineTextEditComponent;

currentTemplate.onCreated(function() {
	this.pageState = new ReactiveDict();
	this.textareaHeight = 0;

	this.textareaValue = null;
});

currentTemplate.onRendered(function() {
	this.autorun((tracker) => {
		if(this.pageState.get("editing")) {
			this.$("div").closest("form").addClass("with-inline-editing");
		} else {
			this.$("div").closest("form").removeClass("with-inline-editing");

			if(!tracker.firstRun) {
				// Save current textarea value when editor gets closed
				this.textareaValue = this.$("textarea").val();
			}
		}
	});
});

currentTemplate.helpers({
	textareaHeight() {
		return Template.instance().textareaHeight;
	},

	textareaValue() {
		const tv = Template.instance().textareaValue;
		return  tv !== null? tv: Template.currentData().value;
	},
});


currentTemplate.events({
	"click .component--inline-text-edit"(event, template) {
		template.pageState.set("editing", true);

		// Catch clicks outside of our form
		const myform = $(event.target).closest("form")[0];

		// Function to catch the out-of-form clicks and close the form
		const outerClick = (event2) => {
			const newform = $(event2.target).closest("form");
			if(newform.length && newform[0] == myform) { return; }

			$(document).off("click", outerClick);
			template.pageState.set("editing", false);

			event2.stopPropagation();
			event2.cancelBubble = true;
		};

		// Set height equal to plain by default to avoid flickering
		template.textareaHeight = $(event.target).height();

		Meteor.defer(() => {
			const ta = template.$("textarea");
			ta.focus();

			resize(ta[0]);

			// Any click beyond the form cancels it
			$(document).on("click", outerClick);
		});
	},

	/**
	 * Catch enter to submit form
	 * @param event
	 * @param template
	 * @returns {boolean}
	 */
	"keypress textarea"(event, template) {
		const code = (event.keyCode? event.keyCode: event.which);

		let submit = false;
		if(code == 13 && !template.data.allowReturn) { submit = true; }
		if(code == 10 && event.ctrlKey) { submit = true; }

		if(submit) {
			template.pageState.set("editing", false);
			$(event.target)
				.blur()
				.closest("form").submit();

			return false;
		}

		Meteor.defer(() => { resize(event.target); });
	},

	"paste textarea"(event, template) {
		console.log("resize");
		Meteor.defer(() => { resize(event.target); });
	},

	"keydown textarea"(event, template) {
		const code = (event.keyCode? event.keyCode: event.which);
		if(code == 27) {
			template.pageState.set("editing", false);
			$(event.target)
				.blur();

			return false;
		}
	}
});


function resize(ta) {
	const heightOffset = 2; // border

	ta.style.height = (ta.scrollHeight + heightOffset) + 'px';
	ta.scrollTop = 0;
	// used to check if an update is actually necessary on window.resize
	//clientWidth = ta.clientWidth;
}
