import { BrowserRouter as Router, Route } from "react-router-dom";
import ReactDOM from "react-dom";
import "./styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css";
import React, {useEffect, useState} from 'react';
import { useTable, useSortBy } from 'react-table'
import axios from "axios";
import styled from 'styled-components'

let API_KEY = "";
let api = axios.create({
  headers: {
    "Client-ID": API_KEY
  }
});

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`

function Table({ columns, data }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
    },
    useSortBy
  )

  // We don't want to render all 2000 rows for this example, so cap
  // it at 20 for this use case
  const firstPageRows = rows.slice(0, 20)

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                // Add the sorting props to control sorting. For this example
                // we can add them into the header props
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  {/* Add a sort direction indicator */}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? '[biggest]'
                        : '[lowest]'
                      : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {firstPageRows.map(
            (row, i) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return (
                      <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                    )
                  })}
                </tr>
              )}
          )}
        </tbody>
      </table>
      <br />
      <div>Showing the first 20 results of {rows.length} rows</div>
    </>
  )
}

class Streams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      table: [{id: 0}],
      columns: [
        {
          Header: 'Top Streamers',
          columns: [
            {
              Header: 'id',
              accessor: 'id',
            },
          ],
        },

      ]
    };
  }

  componentDidMount() {
    const fetchData = async () => {
      var pagination = null;
      var top = [];
      while (true) {
        let pagination_var = pagination ? 'after=' + pagination : '';
        const result = await api.get(
            'https://api.twitch.tv/helix/streams?first=100&' + pagination_var);
        if (result.status != 200) {
          console.log('error at :' + result);
          break;
        }
        top = top.concat(result.data.data);
        pagination = result.data.pagination.cursor;
        console.log('got next 100: ' + result.data.data[0].viewer_count);
        if (result.data.data[0].viewer_count < 1000) break;
      }
      this.setState({
        table: top
      });
      {
        var json = top;
        var fields = Object.keys(json[0]);
        var columns = [];
        fields.forEach(f => columns.push({Header:f, accessor:f}));
        this.setState({columns:[
          {
            Header: 'Top Streamers',
            columns: columns
          },
        ]});
        var replacer = function(key, value) {
          return value === null ? '' : value;
        };
        var csv = json.map(function(row) {
          return fields
              .map(function(fieldName) {
                return JSON.stringify(row[fieldName], replacer);
              })
              .join(',');
        });
        csv.unshift(fields.join(','));
        csv = csv.join('\r\n');
        console.log(csv);
      }
    };
    fetchData();
  }

  render() {
    
    return <Styles>
      <Table columns = {this.state.columns} data = {this.state.table} />
    </Styles>;
  }
}

function App() {
  return (
    <Streams>
    
    </Streams>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
