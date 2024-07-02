import './Promoted.css';

import emeraldImg from '../../assets/img/emerald.png';
import rubyImg from '../../assets/img/ruby.png';
import diamondImg from '../../assets/img/diamond.png';
import loadingImg from '../../assets/img/loading.svg';
import { useEffect, useState, useContext  } from 'react';
import MUIDataTable from "mui-datatables";
import { createTheme, ThemeProvider } from "@material-ui/core/";
import { database } from '../../helpers/firebase.js';
import { NotificationManager } from "react-notifications";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context';
import watchlistImg from '../../assets/img/watchlisted.png';
import nonwatchlistImg from '../../assets/img/nonwatchlisted.png';
import axios from 'axios';
import { ENVS } from "../../helpers/configurations";
import { ethers } from "ethers";

import React from 'react';
import ReactDOM from 'react-dom';
export const Promoted = (props) => {

    const titleStr = props.title;
    const filterStr = props.filter;
    const caption = props.caption;
    const [load, setLoaded] = useState(0);
    const [loading, setLoading] =useState(true);
    const [allData, setAllData] = useState({});
    const { walletAddress, synchroTables, handleSynchroTables } = useContext(AppContext);

    const [allShowData, setAllShowData] = useState([]);
    const [openWatchListDlg, setWatchListDlg] = useState(false);
    const [rowId, setRowId] = useState("");
    const [wlDlgTitle, setWlDlgTitle] = useState("");
    const navigate = useNavigate();

    useEffect(()=>{
        setLoading(true);
        setAllData({});
        let tempData = [];
        console.log("promoted js filterstr = ", filterStr);
        const dbRef = database.ref("/coinlist");
        // dbRef.orderByChild(filterStr).limitToFirst(10).on('value', async (snapshot) => {
        dbRef.orderByChild("promoted").startAt(1).on('value', async (snapshot) => {
            if(snapshot.exists()){
                setAllData(snapshot.val());
                let wlImg = "";
                let tempSnapShot = snapshot.val();
                
                for(let i in tempSnapShot){
                    wlImg = nonwatchlistImg;
                    
                    let wlList = tempSnapShot[i].watchlist;

                    if (wlList?.includes(walletAddress)){
                        wlImg = watchlistImg;
                    }
                    
                    let tierImg = emeraldImg;
                    if(tempSnapShot[i].voteCount >= ENVS.DIAMOND_TIRE_LIMIT) {
                        tierImg = diamondImg;
                    }else if(tempSnapShot[i].voteCount >= ENVS.RUBY_TIRE_LIMIT) {
                        tierImg = rubyImg;
                    }
                    
                    let mcap, change24h;
                    if(tempSnapShot[i].presale === true){
                        mcap = "Presale";
                        change24h = "-"
                    }else{
                        let qs = `?symbol=${tempSnapShot[i].symbol}&convert=USD`;
                        let res = await axios.get('https://agile-cove-74302.herokuapp.com/https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest' + qs, {
                                headers: { 'X-CMC_PRO_API_KEY': "a8dd2502-9e7c-4bf6-8cd2-29d2829e042a" }})
                        
                        let tempSymbol = tempSnapShot[i].symbol;
                        mcap = res.data.data[tempSymbol]?.quote.USD.market_cap;
                        change24h = res.data.data[tempSymbol]?.quote.USD.percent_change_24h;
                        
                    }
                    
                    tempData.push([
                        tempSnapShot[i].logo, 
                        tempSnapShot[i].name, 
                        tempSnapShot[i].network,
                        isNaN(mcap) ? mcap: floorValue(mcap),
                        isNaN(change24h) ?  change24h:floorValue(change24h),
                        convertLaunchDate(tempSnapShot[i].launch), 
                        tierImg, 
                        tempSnapShot[i].voteCount, 
                        "",
                        wlImg,
                        i
                    ]);
                }
                
                setAllShowData(tempData);
                setLoaded(1);
                setLoading(false);
            }else{
                setAllData({});
                setAllShowData([]);
                setLoading(false);
            }
        })
     

    },[load, rowId, walletAddress, synchroTables])

    const floorValue = (value) => {
        if(value > 1000000000){
            return (Math.floor(value/1000000000*100)/100) + " B";
        }
        else if(value > 1000000) {
            return (Math.floor(value/1000000*100)/100) + " M";
        }else if(value > 1000){
            return (Math.floor(value/1000*100)/100).toString + " K";
        }else{
            return Math.floor(value*100)/100;
        }
    }
    
    const handleOpenWatchListDlg = (id) => {
        let wllist = allData[id].watchlist;

        if(wllist.includes(walletAddress)){
            setWlDlgTitle("You are going to remove this project from your Watchlist?");
        }else{
            setWlDlgTitle("You are going to add this project to your Watchlist?");
        }
        setRowId(id);
        setWatchListDlg(true);
    }
    const handleCloseWatchListDlg = () => {
        setWatchListDlg(false);
    }
    const convertLaunchDate = (epoch) => {
        let dateDiff = 0;
        let monthDiff = 0;
        let yearDiff = 0;

        let countNow = Math.floor(Math.floor(Date.now() / 1000) / 86400);
        let launchDate = Math.floor(epoch / 86400);

        if(countNow > launchDate){
            dateDiff = countNow - launchDate;
            if(countNow - launchDate > 365){
                yearDiff = Math.floor(dateDiff / 365);
                return yearDiff.toString() + " Year Ago";
            }else if( dateDiff > 30){
                monthDiff = Math.floor(dateDiff / 30);
                return monthDiff.toString() + " Mon Ago";
            }else{
                dateDiff = countNow - launchDate;
                return dateDiff.toString() + " Day Ago";
            }
        }else if(countNow < launchDate){
            dateDiff = launchDate - countNow;
            if( dateDiff > 365 ) {
                yearDiff = Math.floor(dateDiff / 365);
                return "In " +  yearDiff.toString() + " Year";
            }
            else if( dateDiff > 30 ){
                monthDiff = Math.floor(dateDiff / 30);
                return "In " +  monthDiff.toString() + " Mon";
            }
            else{
                return "In " +  dateDiff.toString() + " Day";
            }
        }else{
            return "Today";
        }
         
    }

    const onRowClick = (rowData, rowMeta, e) => {
        
        if(e.target.type === 'submit' || e.target.type === 'number' || e.target.src === watchlistImg || e.target.src === nonwatchlistImg) {
            return;
        }else
        {    
            // setSelectedRowData(allData[rowData[8]]);
            navigate("/details/" + rowData[10], {replace: true});
        }
    }

    const wlBtnClicked = () => {
        if (walletAddress === ""){
            NotificationManager.error("You have to connect wallet first");
            return;
        }

        handleCloseWatchListDlg();

        let wllist = allData[rowId].watchlist;
        if(wllist.includes(walletAddress)){
            let db = database.ref("/coinlist/" + rowId);
            db.update({ watchlist: wllist.replace(walletAddress + ",", "") }
            ).catch(e => {
                NotificationManager.error("Can not add.");
                console.log(e);
            }).then(()=> {
                NotificationManager.success("Removed successfully.");
                setLoaded(load + 1);
                handleSynchroTables(synchroTables + 1);
            });   
        }else{
            let db = database.ref("/coinlist/" + rowId);
            db.update({ watchlist: allData[rowId].watchlist + walletAddress + ","  }
            ).catch(e => {
                NotificationManager.error("Can not add.");
                console.log(e);
            }).then(()=> {
                NotificationManager.success("Added successfully.");
                setLoaded(load + 1);
                handleSynchroTables(synchroTables + 1);
            });   
        }
    }

    const voteClicked = async (id) =>{
        let dbRef = database.ref("/votelimit");
        let dailyStart = 0;
        let dailyCount = 0;
        let epochNow = Math.floor(Date.now() / 1000);
        let tempId = "";
        let ret_val = false;
        dbRef.orderByChild("wallet").equalTo(walletAddress).on('value', (snapshot) => 
        {
            // wallet exists
            if(snapshot.exists()){
                // console.log("wallet exists already in vote limit table");
                let tempRow = snapshot.val();
               
                for(let i in tempRow){ // i = asdfawefawefx  => example
                    tempId = i;
                    dailyStart = tempRow[i].dailyStart;
                    dailyCount = tempRow[i].dailyCount;
                }

                console.log(dailyCount, "daily count");
                if(dailyCount >= 5 && (epochNow - dailyStart) <= 24*60*60 ){
                    NotificationManager.error("You can only vote 5 times per day.");
                    ret_val = true;
                }
            }
        })
        if(ret_val) return;
        const infuraProvider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = infuraProvider.getSigner()

        const tx = {
            from: walletAddress,
            to: ENVS.CHARITY_ADDR,
            value: ethers.utils.parseUnits(ENVS.NORMAL_VOTE_FEE),
        };
            
        await signer.sendTransaction(tx).then(async () => {

            if(tempId === ""){
                dbRef.push({ wallet: walletAddress, dailyStart: Math.floor(epochNow/86400) * 86400, dailyCount: dailyCount + 1});
            }else{
                let dbRefUpdate = database.ref("/votelimit/" + tempId);
                dbRefUpdate.update({ dailyCount: dailyCount + 1 });
            }

            let db = database.ref("/coinlist/" + id);

            let updateDailyCount = 0;
            let updateDailyStart = 0;

            let updateWeeklyCount = 0;
            let updateWeeklyStart = 0;

            let epochNowDay = Math.floor(epochNow/86400) * 86400;
            if(epochNowDay - Number(allData[id].updateWeeklyStart) > 86400 * 7){
                updateWeeklyCount = 1;
                let getDayCount = Math.floor(epochNow/86400) % 7;
                switch(getDayCount){
                    case 0:
                        updateWeeklyStart = (Math.floor(epochNow/86400) - 3 ) * 86400;
                        break;
                    case 1:
                        updateWeeklyStart = (Math.floor(epochNow/86400) - 4 ) * 86400;
                        break;
                    case 2:
                        updateWeeklyStart = (Math.floor(epochNow/86400) - 5 ) * 86400;
                        break;
                    case 3:
                        updateWeeklyStart = (Math.floor(epochNow/86400) - 6 ) * 86400;
                        break;
                    case 4:
                        updateWeeklyStart = (Math.floor(epochNow/86400) - 0 ) * 86400;
                        break;
                    case 5:
                        updateWeeklyStart = (Math.floor(epochNow/86400) - 1 ) * 86400;
                        break;
                    case 6:
                        updateWeeklyStart = (Math.floor(epochNow/86400) - 2 ) * 86400;
                        break;
                    default:
                        updateWeeklyStart = 0;
                        break;
                    }
            }else{
                updateWeeklyStart = allData[id].weeklyStart;
                updateWeeklyCount = allData[id].weeklyCount + 1;
            }

            if(epochNow - Number(allData[id].dailyStart) < 86400){
                updateDailyCount = Number(allData[id].dailyCount) + 1;
                updateDailyStart = Number(allData[id].dailyStart)
            }else{
                updateDailyCount = 1;
                updateDailyStart = Math.floor(epochNow/86400) * 86400;
            }

            db.update({ voteCount: Number(allData[id].voteCount) + 1,
                        dailyStart: updateDailyStart,
                        dailyCount: updateDailyCount,
                        weeklyStart: updateWeeklyStart,
                        weeklyCount: updateWeeklyCount})
            
            if(Number(allData[id].voteCount) < ENVS.DIAMOND_TIRE_LIMIT && Number(allData[id].voteCount) + 1 >= ENVS.DIAMOND_TIRE_LIMIT){
                await fetch(`${process.env.REACT_APP_SERVER_URL}/diamond/?token=${allData[id].name}`, {
                    method: "GET"
                })
                .then(() => {
                    NotificationManager.info("Notification about Diamond Tier has sent to TG channel.");
                })
                .catch(err => console.log(err))

            }else if(Number(allData[id].voteCount) < ENVS.RUBY_TIRE_LIMIT && Number(allData[id].voteCount) + 1 >= ENVS.RUBY_TIRE_LIMIT){
                await fetch(`${process.env.REACT_APP_SERVER_URL}/ruby/?token=${allData[id].name}`, {
                    method: "GET"
                })
                .then(() => {
                    NotificationManager.info("Notification about Ruby has sent to TG channel.");
                })
                .catch(err => console.log(err))
            }else{

            }
        }).catch((e) => {
            NotificationManager.error("Transaction failed.");
            console.log(e);
        })

        handleSynchroTables(synchroTables + 1);
        setLoaded(load + 1);
    }

    const columns = [
        {
            name:"Logo",
            options:{
                customBodyRender: (value) => {
                    // console.log(value, "bbbbbbb"); 
                    return (
                        <div className="logoImgDiv"><img src={value} alt=""/></div>
                    );
                }
            }
        }, 
        {
            name:"Name",
            options:{
                setCellProps: () => ({
                    style: {
                      whiteSpace: "nowrap",
                      position: "sticky",
                      backgroundColor: "#290825",
                      left: "0",
                      zIndex: 100
                    }
                }),
            }
        }, 
        "Chain",
        "MCAP",
        {
            name:"Change 24h",
            options:{
                customBodyRender: (value, tableMeta, updateValu) => {
                    
                    let val = tableMeta.rowData[4];
                    
                    if (isNaN(val)){
                        return (
                            <div className="change24hDiv" style={{ color: "white"}}><span>{val}</span></div>
                        );
                    }
                    else if (val < 0){
                        val = 0 - val;
                        return (
                            <div className="change24hDiv" style={{ color: "yellow"}}><span>{"- " + val + " %"}</span></div>
                        );
                    }
                    else{
                        return (
                            <div className="change24hDiv"  style={{ color: "green"}}><span>{ "+ " + tableMeta.rowData[4] + " %"}</span></div>
                        );
                    }
                }
            }
        }, 
        "Launch",
        {
            name:"Tier",
            options:{
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className="tierImgDiv"><img src={tableMeta.rowData[6]} alt="" /></div>
                    );
                }
            }
        }, 
        "Vote Counts",
        {
            name: "",
            options:{
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className="voteBtnDiv">
                            <div className="voteBtnWrapped">
                                <button className="voteBtn" onClick={() => voteClicked(tableMeta.rowData[10])}>VOTE</button>
                            </div>
                            <Dialog
                                open={openWatchListDlg}
                                onClose={handleCloseWatchListDlg}
                                aria-labelledby="alert-dialog-title"
                                aria-describedby="alert-dialog-description"
                            >
                                <DialogTitle id="alert-dialog-title">
                                    {wlDlgTitle}
                                </DialogTitle>
                                <DialogActions>
                                <Button type="submit" onClick={wlBtnClicked} autoFocus>Yes</Button>
                                <Button type="submit" onClick={handleCloseWatchListDlg}>
                                    No
                                </Button>
                                </DialogActions>
                            </Dialog>
                        </div>
                    );
                }
            }
        },
        {
            name: "WatchListed",
            options:{
                customBodyRender: (value, tableMeta, updateValue) => {
                    // console.log(tableMeta.rowData[5], "aaaaaaaaaaaaa"); 
                    return (
                        <div className="wlImgDiv" onClick={()=> handleOpenWatchListDlg(tableMeta.rowData[10])}>
                            <img className="wlImg" src={tableMeta.rowData[9]} alt=""></img>
                        </div>
                    )
                }

            }
        },{
            name:"Hidden",
            options:{
                display: "false"
            }
        }  
    ];
   
    const options = {
        filter: false,
        // filterType: "dropdown",
        // responsive: "vertical",
        responsive:"standard",
        rowHover: true,
        tableBodyMaxHeight: "100%",
        selectableRows: 'none',
        viewColumns: false,
        fixedSelectColumn: true,
        onRowClick:onRowClick
    };

    // const epochToDate = (epoch) => {
    //     return moment.unix(epoch).format('YYYY/MM/DD');
    // }

    const getMuiTheme = () =>
        createTheme({
            overrides: {
                MuiTableCell:{
                    body:{
                        color: "white",
                        fontWeight:"bold",
                        fontSize: "20px",
                        
                        // borderColor: "#669999"
                    },
                    root:{
                        textAlign:"center"
                        // borderColor: "#669999",
                    },
                },
                MUIDataTableBodyRow: {
                    root: {
                        backgroundColor: "#290825",
                        color:"white",
                        // borderColor:"#669999",
                        '&:hover': {
                            backgroundColor: '#669999 !important'
                        },
                        height: "30px"
                    }
                },
                MUIDataTableBodyCell:{
                    root:{
                        textAlign: "center"
                    }
                },
                MUIDataTableFilter: {
                    root: {
                    backgroundColor: "#669999",
                    }
                },
                
                MUIDataTable:{
                    paper:
                    {width: "99%",
                // borderColor: "#290825",
                color: "white"}
                    
                }
                ,
                MUIDataTableToolbar: {
                root: {
                    backgroundColor: "#290825"
                }
                },
                MUIDataTableHeadCell: {

                    fixedHeader:{
                        backgroundColor:"#290825",
                        color: "white",
                        alignContent:'center',
                        

                    },
                    data:{
                        color: "white",
                        

                    },
                    sortActive:{
                        color: "white",
                        alignItems: "center !important",
                        
                    },
                    sortAction: {
                        alignItems:"center",
                        justifyContent:"center"
                    },
                    contentWrapper:{
                        justifyContent:"center",
                        textAlign:"center"
                    }
                },
                MuiSvgIcon:{
                    root:{
                        color: "white"
                    }
                },
                MUIDataTableSearch:{
                    searchIcon:{
                        color: "white"
                    },
                    searchText:{
                        color: "white"
                    }
                },
                MuiTableSortLabel:{
                    root: {
                        color:"white !important"   
                    },
                    active: {
                        color:"white !important"   
                    },
                    icon: {
                        color:"white !important"
                    },
                    iconDirectionAsc:{
                        color: "white !important"
                    },
                    iconDirectionDesc:{
                        color: "white !important"
                    }
                },
                MuiTablePagination:{
                    root:{
                        color:"white"
                    }
                },
                MuiSelect:{
                    icon:{
                        color:"white"
                    },
                    root:{
                        color:"white"
                    }
                },
                MuiTypography:{
                    h6:{
                        textAlign: 'center'
                    }
                },
                MUIDataTableFooter:{
                    root:{
                        display: "none"
                    }
                }
            }
    });

    return(
        <div className="showcoinDivWrapped">
            {loading === false ? (
                <div className="showcoinDiv">
                    <div className="diamondWrappedDiv">
                        <div className="diamondDiv">
                            {/* <img src={diamondImg}></img> */}
                            <span>{titleStr}</span>
                        </div>
                    </div>
                    
                    <ThemeProvider theme={getMuiTheme()}>
                        <MUIDataTable data={allShowData} columns={columns} options={options} title={caption}/>
                    </ThemeProvider >
                </div>):(
                    <div className="showcoinDiv"> 
                        <div className="diamondWrappedDiv">
                            <div className="diamondDiv">
                                <span>{titleStr}</span>
                            </div>
                        </div>
                        
                        <div className="loadingDiv">
                            <img src={loadingImg} alt="loading" />
                        </div>
                    </div>
                )}    
        </div>
    )
}

export default Promoted;