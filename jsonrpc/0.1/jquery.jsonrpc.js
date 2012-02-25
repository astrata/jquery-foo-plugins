/*
  Copyright (c) 2012
  Written by José Carlos Nieto <xiam@menteslibres.org>

  Licensed under the MIT License
  Redistributions of files must retain the above copyright notice.
*/

(
  function($) {
    var methods = {
      
      'init': function() {
        return this.each(
          function() {
            if (!$(this).data('__jsonRpc')) {
              $(this).bind('submit', methods.__onSubmit);
              $(this).data('__jsonRpc', true);
            };
          }
        );
      },

      'callback': function(fn) {
        $(this).data('callback', fn);
      },

      // Really simple browser-sider validation. 
      'validate': function() {
        var inputs = $(this).jsonRpc('getInputs');
        inputs.removeClass('validation-error');

        var errors = [];

        for (var i = 0; i < inputs.length; i++) {
          var input = $(inputs[i]);
          var val   = input.val();
          var error = null;

          if (input.hasClass('validate-email')) {
            if (!val.match(/^[a-z][a-z0-9_+\.]+@[a-z0-9\-]+\.[a-z0-9\.-]+$/i)) {
              error = 'validate-email';
            };
          };
          
          if (input.hasClass('validate-numeric')) {
            if (!val.match(/^[0-9]+$/)) {
              error = 'validate-numeric';
            };
          };
          
          if (input.hasClass('validate-not-null')) {
            if (!val) {
              error = 'validate-not-null';
            };
          };
          
          if (input.hasClass('validate-checked')) {
            if (!input.attr('checked')) {
              error = 'validate-checked';
            };
          };

          if (error) {
            errors.push({
              'input':  input,
              'type':   error
            });
            input.addClass('validation-error');
          };
        };

        $(this).jsonRpc('errors', errors);

        if (errors.length > 0) {
          return false;
        } else {
          return true;
        };

      },

      'errors': function(errors) {
        if (errors) {
          $(this).data('validation-errors', errors);
        } else {
          return $(this).data('validation-errors');
        };
      },

      '__onSubmit': function(ev) {

        var $this = $(ev.currentTarget);

        $this.jsonRpc('lockSubmit');

        if ($this.jsonRpc('validate')) {
         
          // Hidden frame
          var helper = null;

          for (var i = 0; helper == null; i++) {

            var target = '__helper-frame-'+i;

            if (!document.getElementById(target)) {

              if ($.browser.msie && $.browser.version.substr(0,1) < 8) {
                
                // IE hack
                var helper = $('<iframe id="'+target+'" name="'+target+'" src="about:blank" />');
                $(document.body).append(helper);
                helper = $(helper);

              } else {
              
                var helper = $('<iframe />', {
                  'id':   target,
                  'name': target,
                  'src':  $.browser.opera ? 'opera:about' : 'about:blank'
                }).appendTo(document.body);
              }
            
              $(helper).hide();
            }
          }

          // IE6 hack that waits for helper to be appended 
          while (!document.getElementById(target)) {
            // Nothing really.
          };

          helper.bind(
            'load',
            methods.__onReply
          ); 

          helper.data('origin', $this);
      
          // Submit through the iframe and lock.
          $this.attr('target', helper.attr('name'));

          this.submit();

          $this.jsonRpc('lock');

        } else {

          $this.jsonRpc('unlockSubmit');

          var errors = $this.jsonRpc('errors');

          errors.shift().input.focus();

        };

        return false;
      },

      '__onReply': function() {

        var form = $(this).data('origin');

        window.setTimeout(
          function() {
            form.jsonRpc('unlock');
          }
        , 500);

        form.jsonRpc('unlockSubmit');

        var helper = $(this);

        if (this.contentDocument) {
          var doc = this.contentDocument;
        } else if (this.contentWindow) {
          var doc = this.contentWindow.document;
        } else {
          var doc = this.document;
        }

        var response = doc.body.innerHTML;
        
        var txt = $('<textarea/>')[0];

        txt.innerHTML = response.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        if (txt.value) {

          if (txt.value.match(/<pre/ig)) {
            txt.value = txt.value.replace(/<pre[^>]*?>/i, '').replace(/<\/pre>/i, '');
          };

          var json = $.parseJSON(txt.value);

          var callback = form.data('callback');

          if (callback) {
            
            callback.apply(callback, [ json ]);

          } else {
          
            callback = form.find('[name="_callback"]');

            if (callback.length > 0) {

              var path  = callback.val().split('.');
              var fn    = path.pop();
              
              var ob = window;
              while (path.length > 0) {
                ob = ob[path.shift()];
              };

              if (typeof ob[fn] == 'function') {
                return ob[fn].apply(ob, [ json ]);
              } else {
                return ob[fn](json);
              };

            } else {
              form.jsonRpc('rpc', json);
            };

          };

        };
      },

      'rpcExecute': function(args) {

        if (typeof args != 'object') {
           args = [ args ];
        };

        for (var i = 0; i < args.length; i++) {
          eval(args[i]);
        };

      },

      'rpcReload': function() {
        window.location.reload();
      },

      'rpcRedirectTo': function(url) {
        window.location.href = url;
      },

      'rpcSuccess': function(message) {
        if ($.browser.msie && $.browser.version.substr(0,1) < 7) {
          alert(message);
        } else {
          $.gritter.add({
            text: message
          });
        }
      },
      
      'rpcError': function(message) {
        if ($.browser.msie && $.browser.version.substr(0,1) < 7) {
          alert(message);
        } else {
          $.gritter.add({
            text: message
          });
        }
      },

      'rpc': function(json) {

        if (!json.errorMessage && !json.inputError && !json.cancelReset) {
          $(this)[0].reset(); 
        };
        
        for (var method in json) {
          var args = json[method];
          var name = 'rpc'+method.charAt(0).toUpperCase()+method.substr(1);
          $(this).jsonRpc(name, args);
        };
      },

      'getInputs': function() {
        return $.merge($('input', this), $('select', this), $('textarea', this));
      },
 
      'lock': function() {
        var fields = $(this).jsonRpc('getInputs');

        fields.each(
          function() {
            $(this).attr('readonly', 'readonly');
          }
        );

        $(this).stop();
        $(this).animate({
          'opacity': 0.5
        });

        // TODO: spinner
      },

      // Unlock form
      'unlock': function() {
        var fields = $(this).jsonRpc('getInputs');

        fields.each(
          function() {
            $(this).removeAttr('readonly');
          }
        );

        // TODO: remove spinner
        $(this).stop();
        $(this).animate({
          'opacity': 1
        });
      },

      // Unlocks buttons.
      'unlockSubmit': function() {
        $(this).find('button').each(
          function() {
            var el = $(this);
            if (el.attr('type') == 'submit' || !el.attr('type')) {
              el.removeAttr('disabled');
            }
          }
        );
      },

      // Locks buttons.
      'lockSubmit': function(el) {
        $(this).find('button').each(
          function() {
            var el = $(this);
            if (el.attr('type') == 'submit' || !el.attr('type')) {
              el.attr('disabled', 'disabled');
            }
          }
        );
      }
    };

    $.foo.plugin('jsonRpc', methods);

    var start = function() {
      $('form.json-rpc').each(
        function() {
          $(this).jsonRpc();
        }
      );
    };

    $(document).ready(start);

  }
)(jQuery);

