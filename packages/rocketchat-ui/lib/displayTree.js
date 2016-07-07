// ************** Generate the tree diagram	 *****************
window.displayTree = function(treeData, treeDepth, treeWidth) {
  var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 60
  };
  var width = window.innerWidth || document.documentElement.clientWidth ||
    document.body.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight ||
    document.body.clientHeight;
  width = width - margin.right - margin.left;
  height = height - margin.top - margin.bottom;
  if (treeWidth) {
    height = treeWidth * 680 / 30;
  }
  wstep = width / treeDepth;
  wstep1 = wstep * 0.5;

  var i = 0,
    duration = 300,
    root;

  var tree = d3.layout.tree()
    .size([height, width]);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) {
      return [d.y, d.x];
    });
  var id = (new Date()).getTime();

  function close() {
    clearInterval(searchTimer);
    setTimeout(function() {
      var svg = document.getElementById(id);
      svg.parentNode.removeChild(svg);
    }, 500);
  }
  window.closeTree = close;

  var svg = d3.select("body").append("div")
    .attr("id", id)
    .attr("class", "treecontainer")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var input = document.createElement("input");
  document.getElementById(id).appendChild(input);
  input.setAttribute("id", "exit" + id);
  input.setAttribute("type", "button");
  input.setAttribute("class", "treeclose");
  input.value = "X";
  input.setAttribute("onclick",
    "window.closeTree();");

  input = document.createElement("input");
  document.getElementById(id).appendChild(input);
  input.setAttribute("id", "input" + id);
  input.setAttribute("class", "treesearch");
  input.setAttribute("placeholder", "Search");
  var searchValue = "";
  var searchTimer = setInterval(function() {
    if (input.value != searchValue) {
      searchValue = input.value;
      svg.selectAll('text.name')
        .style("text-decoration", function(d) {
          if (searchValue.length > 0 && Array.isArray(d.usernames)) {
            var found = false;
            for (var i = 0; i < d.usernames.length; i++) {
              if (d.usernames[i].toUpperCase().indexOf(
                  searchValue.toUpperCase()) >= 0) {
                found = true;
                break;
              }
            }
            if (found)
              return "underline";
          }

          return "none";
        })
        .style("fill", function(d) {
          if (d.alert)
            return "none";
          else
            return searchValue.length > 0 && d.name.toUpperCase().indexOf(
                searchValue.toUpperCase()) >=
              0 ?
              "red" : "black";
        })
        .style("stroke", function(d) {
          if (d.alert)
            return searchValue.length > 0 && d.name.toUpperCase().indexOf(
                searchValue.toUpperCase()) >=
              0 ?
              "red" : "black";
          else
            return "none";
        });
    }
  }, 1000);

  root = treeData[0];
  root.x0 = height / 2;
  root.y0 = 0;

  update(root);

  //d3.select(self.frameElement).style("height", "500px");

  function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      if (d.depth < 2) {
        d.y = d.depth * wstep1
      } else {
        d.y = d.depth * (width - wstep1) / (treeDepth - 1) + wstep1 -
          (
            width - wstep1) / (treeDepth - 1);
      }
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
      .data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("click", click);

    nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("stroke", function(d) {
        return d.url ? "steelblue" : "gray";
      })
      .style("fill", function(d) {
        if (d.unread > 0) return "#1dce73";
        return d._children ? "lightsteelblue" : "#fff";
      });

    nodeEnter.append("text")
      .attr("x", function(d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function(d) {
        return d.name;
      })
      .attr("class", "name")
      .style("fill", function(d) {
        if (d.alert)
          return "none";
        else
          return searchValue.length > 0 && d.name.toUpperCase().indexOf(
              searchValue.toUpperCase()) >=
            0 ?
            "red" : "black";
      })
      .style("stroke", function(d) {
        if (d.alert)
          return searchValue.length > 0 && d.name.toUpperCase().indexOf(
              searchValue.toUpperCase()) >=
            0 ?
            "red" : "black";
        else
          return "none";
      })
      /*.style("font-weight", function(d) {
        return d.alert ?
          "bold" : "normal";
      })
      .style("text-decoration", function(d) {
        return d.alert ?
          "underline" : "none";
      })*/
      /*.style("stroke-width", function(d) {
        return 0.5;
      })*/
      .style("fill-opacity", 1e-6);

    nodeEnter.append("text")
      .attr("x", function(d) {
        return 0;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) {
        return "middle";
      })
      .text(function(d) {
        return d.unread > 0 ? d.unread : "";
      })
      .style("fill", function(d) {
        return "white";
      });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    nodeUpdate.select("circle")
      .attr("r", 10)
      .style("fill", function(d) {
        if (d.unread > 0) return "#1dce73";
        return d._children ? "lightsteelblue" : "#fff";
      });

    nodeUpdate.select("text")
      .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    nodeExit.select("circle")
      .attr("r", 1e-6);

    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
      .data(links, function(d) {
        return d.target.id;
      });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {
          x: source.x0,
          y: source.y0
        };
        return diagonal({
          source: o,
          target: o
        });
      });

    // Transition links to their new position.
    link.transition()
      .duration(duration)
      .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {
          x: source.x,
          y: source.y
        };
        return diagonal({
          source: o,
          target: o
        });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
    if (d.parent === null) {
      close();
    }
    if (d.url) {
      if (d.children || d._children) {
        if (confirm("Open " + d.url))
          window.location.href = d.url;
      } else
        window.location.href = d.url;
    }
  }

  return id;

}

window.breakNameToNodes = function(data) {
  var ret = [];
  var depth = 0;
  var lastdirs = [],
    lastnodes = [];
  //console.log(data);
  for (i = 0; i < data.length; i++) {
    var dirs = data[i].name.split("-");
    if (dirs.length > depth)
      depth = dirs.length;
    var j = 0;
    for (; j < Math.min(lastdirs.length, dirs.length); j++) {
      if (dirs[j].toUpperCase() != lastdirs[j].toUpperCase())
        break;
    }
    var n = lastnodes.length;
    for (k = j; k < n; k++)
      lastnodes.pop();
    for (k = j; k < dirs.length; k++) {
      var node = {
        "name": dirs[k]
      };
      if (k == dirs.length - 1) {
        node.url = data[i].url;
        node.unread = data[i].unread;
        node.alert = data[i].alert;
        node.usernames = data[i].usernames;
        node.lm = data[i].lm;
        node.msgs = data[i].msgs;
      } else {
        node.children = [];
      }
      if (k > 0) {
        if (lastnodes[k - 1].children) {
          lastnodes[k - 1].children.push(node);
        } else {
          lastnodes[k - 1].children = [node];
        }

      } else {
        ret.push(node);
      }
      lastnodes.push(node);
    }
    lastdirs = dirs;
  }
  var w = 0;
  for (i = 0; i < ret.length; i++) {
    if (ret[i].children) {
      w += ret[i].children.length;
    }
  }
  return {
    "nodes": ret,
    "depth": depth,
    "width": Math.max(ret.length, w)
  };
}
