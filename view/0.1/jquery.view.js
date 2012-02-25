/*
  Copyright (c) 2012
  Written by José Carlos Nieto <xiam@menteslibres.org>

  Licensed under the MIT License
  Redistributions of files must retain the above copyright notice.
*/

(
  function($) {

    var methods = {
      'init': function(data) {
        this.each(
          function() {
            $(this).view('render', data);
          }
        ); 
      },

      'safeClone':  function(el) {
        var clone = $(el).clone(false);
        clone.removeAttr('selected');
        clone.removeAttr('checked');
        clone.removeAttr('id');
        return clone;
      },

      'update': function() {
        var data = $(this).data('x-template-data');
        $(this).view('render', data);
      },
  
      'render': function(data) {

        var data = data || {};

        if (typeof data == 'string') {
          var el = $(this);
          $.getJSON(
            data,
            function(data) {
              $(el).view('draw', data);
            }
          );
        } else {
          $(this).view('draw', data);
        };

        $(this).data('x-template-data', data);
      },
  
      'append': function(name, items, context) {

        var directive = $(this).view('getDirective', name);

        var descents = $(this).data('x-template-descents') || {};
        
        if (!descents[name]) {
          return false;
        };

        for (var map in directive) {
          
          for (var key in items) {
            if (items.hasOwnProperty(key)) {
              var item = items[key];

              if (!item['_index']) {
                item['_index'] = key;
              };

              var clone = descents[name].el.clone();
              $(clone).view('execute', directive[map], item, context);
              descents[name].parent.append(clone);
            };
          };

        };

      },
  
      'getDirective': function(name) {
        var directives = $(this).data('x-attached-directive');
        if (name) {
          return directives[name];
        };
        return directives;
      },
  
      'getValue': function(name, context) {

        try {

          var path = name.split('.');

          if (path[0].substr(0, 1) == '@') {

            path[0] = path[0].substr(1);

            var fn    = path.pop();

            var ob = window;
            while (path.length > 0) {
              ob = ob[path.shift()];
            };

            if (typeof ob[fn] == 'function') {
              return ob[fn].apply(ob);
            } else {
              return ob[fn];
            };

          } else {

            var ptr = context;
            
            while (path.length > 0) {
              if (ptr) {
                ptr = ptr[path.shift()]; 
              } else {
                return null;
              };
            };

            return ptr;
          };
        } catch (e) {
          return '';
        }; 
      },

      'setValue': function(elements, attr, value) {

        var attr = attr || 'text';

        attr  = attr.match(/(\+?)([a-zA-Z0-9\-:_]+)(\+?)/);

        attr.shift();

        for (var i = 0; i < elements.length; i++) {

          var item = $(elements[i]);

          var cval = item.attr(attr[1]);

          if (typeof value != undefined) {

            var local = value || '';

            if (attr[1] == 'class') {
              var addrem = local.match(/^([+-]?)(.+)$/);
              if (addrem) {
                if (addrem[1] == '+') {
                  item.addClass(addrem[2]);
                } else if (addrem[1] == '-') {
                  item.removeClass(addrem[2]);
                };
              };
            } else {
              if (attr[1] == 'text') {
                item.text(local);
              } else if (attr[1] == 'html') {
                item.html(local);
              } else {
                if (local) {
                  item.attr(attr[1], local);
                } else {
                  item.removeAttr(attr[1]);
                };
              };
              item.trigger('set');
            };
          } else {
            item.removeAttr(attr[1]);
          };

        };

      },


      'setGroupValue': function(name, value) {

        var name = name.split('@');

        var sel   = $.trim(name[0]);
        var attr  = name[1] ? $.trim(name[1]) : null;

        if (sel == '.') {
          // self
          var elements = $(this);
        } else {
          // children
          var elements = $(this).find(sel);
        };

        $(this).view('setValue', elements, attr, value);
      }, 

      'execute': function(directive, context, parent) {

        $(this).data('x-attached-directive', directive);

        for (var name in directive) {

          var dn = directive[name];

          if (typeof dn == 'function') {

            var value = dn(context, parent);
            
            $(this).view('setGroupValue', name, value);

          } else if (typeof dn == 'string') {
            var value = null;

            // Single var
            if (dn.match(/^[a-z_][a-z0-9_\.]*[a-z0-9\_]$/i)) {
              value = $(this).view('getValue', dn, context);
            } else {
              value = dn;
              // Replacing #{vars}
              while ((m = value.match(/#\{([a-z0-9\_\.]+)\}/i)) !== null) {
                value = value.replace(m[0], $(this).view('getValue', m[1], context));
              };
            };

            $(this).view('setGroupValue', name, value);

          } else if (typeof dn == 'object') {

            var children = $(this).data('x-template-descents') || {};
            
            var first = null;

            if (children[name]) {
              first = children[name];
            };

            if (first == null) {
              var found = $(this).find(name);
              var clone = $(this).view('safeClone', found);
              var first = {
                'el': clone,
                'parent': found.parent()
              };
              children[name] = first;
            };
            
            first.parent.empty();

            $(this).data('x-template-descents', children);

            for (var map in dn) {

              var p     = map.split('<-');
              var vn    = $.trim(p[0]);

              var from  = $(this).view('getValue', p[1].trim(), context);

              var i = 0;
              var clone = null;

              for (var key in from) {
                if (from.hasOwnProperty(key)) {
                  
                  var local = { }
                  local[vn]   = from[key]; // value
                  local['_index'] = key;

                  clone = first.el.clone();

                  $(clone).view('execute', dn[map], local, context);

                  first.parent.append(clone);

                  i++;
                };
              };
            };

          };
        };

      },
      'draw': function(data) {

        var data = data || { };

        $(this).addClass('x-template');

        var scripts = $(this).find('script[type="text/x-template-event"]');

        scripts.each(
          function(i, el) {

            var parent = $(el).parent();

            if (!$(el).data('attached')) {

              var events = eval('('+el.innerHTML+')');
              
              for (var evdef in events) {
                var chunk     = evdef.split('@');
                
                var selector  = $.trim(chunk[0]);
                var listener  = $.trim(chunk[1]);
                var callback  = events[evdef];

                if (listener == 'set') {
                  parent.find(selector).bind(listener, callback);
                } else {
                  parent.delegate(selector, listener, callback);
                };
              };

              $(el).data('attached', true);
            };

          }
        );

        var directives = $(this).find('script[type="text/x-template-directive"]'); 

        for (var i = 0; i < directives.length; i++) {

          var directive = eval('('+directives[i].innerHTML+')');

          for (var subsel in directive) {
            var templates = $(this).find(subsel);
            for (var j = 0; j < templates.length; j++) {
              $(templates[j]).view('execute', directive[subsel], data);
            };
          };
        };

      }  
    };

    $.foo.plugin('view', methods);
  }
)(jQuery);

