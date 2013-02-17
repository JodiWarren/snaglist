Snags = new Meteor.Collection("snags");
Lists = new Meteor.Collection("lists");

Template.snaglist.snagItem = function(){
  return Snags.find({list : Session.get("selected_list")}, {sort: {_id:-1, completed: 1, name:1, status: 1}});
}

Template.snaglist.selected = function () {
  return Session.equals("selected_snag", this._id) ? "selected" : '';
};

Template.snaglist.listTitle = function () {
  thisList = Session.get("selected_list");
    thisListCollection = Lists.findOne(thisList);
  if (thisListCollection != undefined && thisList != null) {
    return thisListCollection.name;
  };
};

Template.snaglist.events({
  'click #addrow' : function () {
    $(".alert").alert('close');
  	newSnag = Snags.insert({name: '', status: '', description: '', assigned: '', completed: '', creator: Meteor.userId(), list: Session.get("selected_list")});
  	Session.set("selected_snag", newSnag);
  },
  'click #deleterow' : function () {
    doomedSnag = Session.get("selected_snag");
    console.log(doomedSnag);
    if (doomedSnag === undefined || doomedSnag === null) {
      $('.alertHolder').html('<div class="alert fade in alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error:</strong> No snag was selected.</div>');
        return;
    } else {
      $(".alert").alert('close');
      doomedSnagCreator = Snags.findOne(doomedSnag).creator;
      if (Meteor.userId() === doomedSnagCreator || doomedSnagCreator == null ) {
        Snags.remove(doomedSnag);
        Session.set("selected_snag", null);
      } else {
        $('.alertHolder').html('<div class="alert fade in alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error:</strong> That was created by a logged-in user. Only they can delete it.</div>');
      };
    }
  },
  'click tr' : function() {
    Session.set("selected_snag", this._id);
    $(".alert").alert('close');
    // console.log(Session);
  },
  'click #rename_list' : function(){
    $('.projectName').popover({
      html: true,
      content: '<form class="form-inline">
                <input type="text" class="input-small" placeholder="New List Name" value="{{listTitle}}">
                <input type="password" class="input-small" placeholder="Password">
                <label class="checkbox">
                  <input type="checkbox"> Remember me
                </label>
                <button type="submit" class="btn">Sign in</button>
              </form>',
      placement: 'bottom',
      container: 'body'
    })
  }
});


Template.listnav.navItem = function(){
  return Lists.find({}, {sort: {name: 1, _id: -1}});
}

Template.listnav.events({
  'click #newlist' : function (event) {
    event.preventDefault();
    newList = Lists.insert({name:'New List', creator: Meteor.userId()});
  },
  'click ul li' : function (event) {
    return Session.set("selected_list", this._id);
  }
});


////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };
  return events;
};

var activateInput = function (input) {
  input.focus();
  input.select();
};

////////////////////////

Template.editableSnag.events(okCancelEvents(
	'input',
	{
		ok: function (value, name) {
			fieldToUpdate = $(name.target).attr('name');
			var setModifier = { $set: {} };
			setModifier.$set[fieldToUpdate] = value;
			Snags.update(this._id, setModifier);
			// Session.set("selected_snag", null);
		},
		cancel: function() {
			Session.set("selected_snag", null);
		}
	}
));



Template.editableSnag.events({
  'change .snag-completed-input' : function(){
    if (this.completed === true) {
      this.completed = false;
    } else {
      this.completed = true;
    }
  },
  'click input' : function() {
    // console.log();
    // console.log(Session);
  }
});

Template.thisSnag.events({
  'change .snag-completed-input' : function(){
    if (this.completed === true) {
      this.completed = false;
    } else {
      this.completed = true;
    }
  },
  'click td' : function() {
    // console.log();
    // console.log(Session);
  }
});

Meteor.startup(function () {
  if (!Session.get("selected_list")) {
    defaultList = Lists.find({}, {sort: {name: 1}});
    setDefaultList  = defaultList.observe({
      added : function (list){
        Session.set("selected_list", list._id);
        setDefaultList.stop();
      }
    })
  };
})
