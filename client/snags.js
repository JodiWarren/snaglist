Snags = new Meteor.Collection("snags");
Lists = new Meteor.Collection("lists");

function get_current_list_name(){
  thisList = Session.get("current_list");
  thisListCollection = Lists.findOne(thisList);
  if (thisListCollection != undefined && thisList != null) {
    return thisListCollection.name;
  };
}

Template.snaglist.snagItem = function(){
  return Snags.find({list : Session.get("current_list")}, {sort: [['completed', 'asc'], ['name', 'asc'], ['status', 'asc'], ['_id', 'desc']]
});
}

Template.snaglist.selected = function () {
  return Session.equals("selected_snag", this._id) ? "selected" : '';
};

Template.snaglist.listTitle = function () {
  return get_current_list_name();
};

Template.snaglist.isprivate = function () {
  thisList = Session.get("current_list");
  thisListCollection = Lists.findOne(thisList);
  // console.log(thisListCollection);
  if (thisListCollection !== undefined) {
    return thisListCollection.isprivate;
  };
};

Template.snaglist.islocked = function () {
  thisList = Session.get("current_list");
  thisListCollection = Lists.findOne(thisList);
  // console.log(thisListCollection);
  if (thisListCollection !== undefined) {
    return thisListCollection.islocked;
  };
};

Template.snaglist.events({
  'click #addrow' : function () {
    $(".alert").alert('close');
  	newSnag = Snags.insert({name: '', status: '', description: '', assigned: '', completed: '', creator: Meteor.userId(), list: Session.get("current_list")});
  	Session.set("selected_snag", newSnag);
  },
  'click #deleterow' : function () {
    doomedSnag = Session.get("selected_snag");
    // console.log(doomedSnag);
    if (!doomedSnag) {
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
    thisList = Session.get("current_list");
    thisListCollection = Lists.findOne(thisList);
    // console.log(thisListCollection);
    if (!thisListCollection.islocked || thisListCollection.creator === Meteor.userId()) {
      Session.set("selected_snag", this._id);
      $(".alert").alert('close');
    } else {
      console.log(typeof(thisListCollection.creator));
      console.log(Meteor.users.findOne({_id: thisListCollection.creator}));
      // thisListOwner = Meteor.users.findOne(thisListCollection.creator).username;
      $('.alertHolder').html('<div class="alert fade in alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error:</strong> You don\'t have access to this locked list. Please contact the list owner for access</div>');
    }
    // console.log(Session);
  },
  'click #rename_list' : function(){
    currentListName = get_current_list_name();
    $('.projectName').popover({
      html: true,
      content: '<form id="rename-form" class="form-inline"><div class="input-append"><input class="input-small span2" id="rename_list_input" value="'+currentListName+'" type="text"><button class="btn btn-success" id="rename_ok" type="button"><i class="icon-ok icon-white"></i></button><button class="btn btn-danger" id="rename_cancel" type="button"><i class="icon-remove icon-white"></i></button></div></form>',
      placement: 'bottom',
      container: '.listtitlewrapper'
    })
  },
  'click #rename_ok' : function() {
    thisList = Session.get("current_list");
    newListName = $('#rename_list_input').val();
    Lists.update(thisList, {$set: {name: newListName}});
    $('.projectName').popover('destroy');
  },
  'click #rename_cancel' : function() {
    $('.projectName').popover('destroy');
  },
  'click #delete_list' : function() {
    $('#delete_confirm').modal();
  },
  'click #delete_ok' : function(){
    thisList = Session.get("current_list");
    Lists.remove(thisList);
    Snags.remove({list: thisList});
    $('#delete_confirm').modal('hide');
  },
  'click #hide_list' : function(){
    thisList = Session.get("current_list");
    thisListCollection = Lists.findOne(thisList);
    if (thisListCollection.isprivate === true ) {
      Lists.update(thisList, {$set: {isprivate: false}});
    } else {
      Lists.update(thisList, {$set: {isprivate: true}});
    }
  },
  'click #lock_list' : function(){
    thisList = Session.get("current_list");
    thisListCollection = Lists.findOne(thisList);
    if (thisListCollection.islocked === true ) {
      Lists.update(thisList, {$set: {islocked: false}});
    } else {
      Lists.update(thisList, {$set: {islocked: true}});
    }
  }
});


Template.listnav.navItem = function(){
  if (Meteor.userId()) {
    return Lists.find({
      $or:
        [
          {isprivate: null},
          {isprivate: undefined},
          {isprivate: false},
          {creator: Meteor.userId()}
        ]},
        {sort: {name: 1, _id: -1}});
  } else {
    return Lists.find({
      $or: [
        {isprivate: null},
        {isprivate: undefined},
        {isprivate: false}
        ]},
        {sort: {name: 1, _id: -1}});
  }
}

Template.listnav.events({
  'click #newlist' : function (event) {
    event.preventDefault();
    newList = Lists.insert({name:'New List', creator: Meteor.userId(), isprivate: true, islocked: true});
  },
  'click ul li' : function (event) {
    return Session.set("current_list", this._id);
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


function snagTickComplete(thisSnagId){
  thisSnag = Snags.findOne(thisSnagId);
  console.log(thisSnag.completed);
  if (thisSnag.completed === true) {
    Snags.update(thisSnagId, {$set: {completed: false}});
  } else {
    Snags.update(thisSnagId, {$set: {completed: true}});
  }
}

Template.editableSnag.events({
  'change .snag-completed-input' : function(){
    snagTickComplete(this._id);
  },
  'click input' : function() {
    // console.log();
    // console.log(Session);
  }
});

Template.thisSnag.events({
  'change .snag-completed-input' : function(){
    snagTickComplete(this._id);
  },
  'click td' : function() {
    // console.log();
    // console.log(Session);
  }
});

Meteor.startup(function () {
  if (!Session.get("current_list")) {
    defaultList = Lists.find({}, {sort: {name: 1}});
    setDefaultList  = defaultList.observe({
      added : function (list){
        Session.set("current_list", list._id);
        setDefaultList.stop();
      }
    })
  };
})
