Meteor.startup(function() {
  Router.route('_hotloader', {
    name: '_hotloader',
    where: 'server',
    action: function() {
      var req = this.request;
      var res = this.response;

      var responses = {
        success: {status: "success"},
        invalid: {status: "invalid", message: "Must have path, type, content" },
        error: {status: "failed", message: "Something went wrong on server. Please resend the request"}
      };

      var filepath = req.body.path,
          filetype = req.body.type,
          filecontent = req.body.content,
          oldContent = req.body.oldContent,
          prePush = req.body.prePush || false;

      if (!(filepath && filetype && filecontent)) {
        res.statusCode = 400;
        res.end(JSON.stringify(responses.invalid));
      }

      var hotloaderDoc = HotLoaderColl.findOne({filepath: filepath}),
          savedOldContent = hotloaderDoc ? hotloaderDoc.content : null;

      oldContent = !!oldContent ? oldContent : savedOldContent;

      try {
        if (!hotloaderDoc) {
          HotLoaderColl.insert({
            filepath: filepath,
            filetype: filetype,
            content: filecontent,
            oldContent: oldContent,
            createdAt: new Date(),
            updatedAt: new Date().getTime(),
            dontEval: filetype === 'js' ? true : false, //old content is required for js files only
            prePush: prePush
          });
        } else {
          HotLoaderColl.update({_id: hotloaderDoc._id}, {$set: {
            content: filecontent,
            oldContent: oldContent,
            updatedAt: new Date().getTime(),
            dontEval: false,
            prePush: prePush
          }});
        }
      } catch(e) {
        res.statusCode = 500;
        res.end(responses.error);
      }

      res.statusCode = 200;
      res.end(JSON.stringify(responses.success));
    }
  });
});
