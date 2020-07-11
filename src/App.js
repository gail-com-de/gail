import React, {Component} from 'react';
import {
    Layout,
    Skeleton,
    Descriptions,
    Divider,
    notification,
    List,
    Tag,
    Avatar,
    Row,
    Col,
    Statistic,
    Button,
    Modal,
    ConfigProvider,
    Input,
    Rate,
    message, Form, InputNumber
} from "antd";

import {WaterWave, Pie} from 'ant-design-pro/lib/Charts';
import 'ant-design-pro/dist/ant-design-pro.css';
import SelectAccount from "./component/SelectAccount"
import BigNumber from "bignumber.js"
import serojs from "serojs"

import "./App.css"
import copy from "copy-text-to-clipboard";
import QRCode from "qrcode";
import Language from "./Lang"
import identicon from "identicon.js"
import Contract from "./component/contract"
// import popup from 'popup-js-sdk'
import seropp from 'sero-pp'
import head from './img/head.png'
import li from './img/li.png'


let ct = new Contract();
let Lang = new Language();
const {Header, Content, Footer} = Layout;

let contractAddress = ct.address;
let ABI = ct.abi;

let contract = serojs.callContract(ABI, contractAddress);

let decimal = new BigNumber(10).pow(18);
const {Countdown} = Statistic;

let host = window.location.host;

const openNotificationWithIcon = (type, message, desc) => {
    notification[type]({
        message: message,
        description: <p
            style={{wordBreak: 'normal', whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: "#0f585b"}}>{desc}</p>,
        duration: null,
    });
};

const InvestForm = Form.create({name: 'form_in_modal2'})(
    class extends React.Component {

        state = {
            confirmLoading: false,
            estimateReturn: 0,
            estimateLevel: 0,
            ticket: 0.000000,
            amount: 0.000000,
            total: 0.000000,
            ticketSero: 0.000000,
            ticketAsnow: 0.000000,
        }

        render() {
            const {visible, rate, balanceSero, balanceTicket, availableSero, availableTicket, onCancel, onCreate, form, referId, investCurrency} = this.props;
            const {getFieldDecorator, setFieldsValue} = form;

            let amountSero = 0;
            let amountTicket = 0;
            if (availableSero != 0) {
                amountTicket = new BigNumber(availableSero).dividedBy(10 * rate).toFixed(6);
                amountSero = availableSero;
                if (Number(amountTicket) > Number(balanceTicket)) {
                    amountTicket = balanceTicket;
                    amountSero = new BigNumber(amountTicket).multipliedBy(10 * rate).toFixed(6);
                }
            } else if (availableTicket != 0) {
                amountSero = new BigNumber(availableTicket).multipliedBy(10 * rate).toFixed(6);
                amountTicket = availableTicket;
                if (Number(amountSero) > Number(balanceSero)) {
                    amountSero = balanceSero;
                    amountTicket = new BigNumber(amountSero).dividedBy(10 * rate).toFixed(6);
                }
            }
            setTimeout(function () {
                let oldReferId = form.getFieldValue("ReferId");
                if (referId && referId !== 0 && oldReferId != referId) {
                    setFieldsValue({"ReferId": referId});
                    if (amountSero != 0 && amountTicket != 0) {
                        setFieldsValue({"ReferId": referId, "AmountSero": amountSero, "AmountTicket": amountTicket});
                    } else {
                        setFieldsValue({"ReferId": referId});
                    }
                }

            }, 1000)


            let that = this;
            return (
                <Modal
                    visible={visible}
                    title={Lang[that.props.lang].account.modal.invest.title}
                    onCancel={onCancel}
                    onOk={() => {
                        this.setState({
                            confirmLoading: true
                        });
                        setTimeout(function () {
                            onCreate(function (res) {
                                that.setState({
                                    confirmLoading: res
                                });
                            });
                        }, 10)
                    }}
                    cancelText={<span style={{color: "#0f585b"}}>{Lang[that.props.lang].account.button.close}</span>}
                    confirmLoading={this.state.confirmLoading}
                >
                    <Form layout="vertical">
                        <Form.Item label={Lang[that.props.lang].account.modal.invest.referId}>
                            {getFieldDecorator(`ReferId`, {
                                rules: [{required: true, message: `Please Input Refer Id`}],
                            })(<Input style={{width: '60%'}} disabled={!(!referId || referId === 0)}
                                      autoComplete="off"/>)}
                        </Form.Item>
                        <p>SERO (1 GAIL = {rate} SERO)</p>

                        <Form.Item
                            label={`${Lang[that.props.lang].account.modal.invest.amount}`}>
                            {getFieldDecorator('AmountSero', {
                                rules: [{required: true, message: `Please Input Amount! `}],
                            })(<InputNumber min={0} precision={6} disabled={investCurrency == "GAIL"} step={100}
                                            style={{width: '60%'}} onChange={(v) => {
                                let ticket = new BigNumber(v).dividedBy(10 * rate).toFixed(6);
                                setFieldsValue({'AmountTicket': ticket});
                            }} allowClear placeholder="0.000000" autoComplete="off"/>)}
                            <br/>{Lang[that.props.lang].account.modal.invest.availableSERO_1}:{availableSero ? availableSero : 0}
                        </Form.Item>

                        <Form.Item label={`${Lang[that.props.lang].account.modal.invest.ticket}`}>
                            {getFieldDecorator('AmountTicket', {
                                rules: [{required: true, message: 'Please input Gail value!'}],
                            })(<InputNumber precision={6} disabled={investCurrency == "SERO"} min={0} step={100}
                                            style={{width: '40%'}} onChange={(v) => {
                                let seroAmount = new BigNumber(v).multipliedBy(10 * rate).toFixed(6);
                                setFieldsValue({'AmountSero': seroAmount});
                            }} allowClear placeholder="0.000000" autoComplete="off"/>)}
                            <br/> {Lang[that.props.lang].account.modal.invest.availableTicket_1}:{availableTicket ? availableTicket : 0}
                        </Form.Item>
                    </Form>
                </Modal>
            );
        }
    },
);


class ContentPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            showAccountSelect: false,
            showDeposit: false,
            showInvest: false,
            showShareProfit: false,
            showWithdraw: false,

            modal1Visible: false,

            currentAccount: {},
            balanceSero: 0,
            balanceTicket: 0,

            ct_rate: 0,
            ct_id: 0,
            ct_details: {},
            topTenInfo: {
                items: []
            },

            lang: "zh_CN",
        }
    }

    componentDidMount() {
        let that = this;
        seropp.init(ct.dapp, function (res) {
            if (res) {
                seropp.getInfo(function (info) {
                    that.setState({
                        lang: info.language,
                    })
                });

                that.showSelectAccount();
                if (!that.state.showAccountSelect) {
                    setTimeout(function () {
                        that.getDetail();
                        that.getRate();
                        that.getTopTenInfo();
                        that.getPoolBalance();
                    }, 3000)
                }

                that.time = setInterval(function () {
                    that.getDetail();
                    that.getRate();
                    that.getTopTenInfo();
                    that.getPoolBalance();
                    if (that.state.currentAccount.PK) {
                        that.getAccount(that.state.currentAccount.PK)
                    }
                }, 60 * 1000)
            }
        });
    }

    componentWillUnmount() {
        if (this.time) {
            clearInterval(this.time)
        }
    }

    showSelectAccount() {

        if (!this.state.currentAccount.PK) {
            let pk = localStorage.getItem("accountPk");
            if (pk) {
                this.getAccount(pk)
                this.setState({
                    loading: false
                })
            } else {
                this.setState({
                    showAccountSelect: true
                })
            }
        }
    }

    showDeposit() {

        this.setState({
            showDeposit: true
        })

        let canvas = document.getElementById('qrImg')
        QRCode.toCanvas(canvas, this.state.currentAccount.MainPKr, function (error) {
            if (error) console.error(error)
        })
    }

    selectAccount = ac => {
        this.setState({
            currentAccount: ac,
            showAccountSelect: false,
            loading: false
        });
        localStorage.setItem("accountPk", ac.PK);
        window.location.reload();

    }

    hiddenAccount = () => {
        this.setState({
            showAccountSelect: false,
        });
    }

    onChange = checked => {
        this.setState({loading: !checked});
    };

    //pullup
    getAccount(pk) {
        let that = this;
        seropp.getAccountDetail(pk, function (currentAccount) {
            let balanceSero = 0;
            let balanceTicket = 0;
            let balanceObj = currentAccount.Balance;
            balanceObj.forEach(function (value, currency) {
                if (currency === 'SERO') {
                    balanceSero = new BigNumber(value).dividedBy(decimal).toFixed(6);
                } else if (currency === 'GAIL') {
                    balanceTicket = new BigNumber(value).dividedBy(decimal).toFixed(6);
                }
            });

            let data = new identicon(pk, 200).toString();
            currentAccount["avatar"] = "data:image/png;base64," + data;
            that.setState({
                currentAccount: currentAccount,
                balanceSero: balanceSero,
                balanceTicket: balanceTicket
            });
        });
    }


    //=== contract

    getDetail() {
        let that = this;
        let res = that.callMethod("details", [], function (res) {
            let detail = {
                id: res[0],
                referId: res[1],
                largeAreaId: res[2],
                amount: new BigNumber(res[3]).dividedBy(decimal).toFixed(6),
                returnAmount: new BigNumber(res[4]).dividedBy(decimal).toFixed(6),
                achievement: new BigNumber(res[5]).dividedBy(decimal).toFixed(6),
                largeAreaTotal: new BigNumber(res[6]).dividedBy(decimal).toFixed(6),
                seroBalance: new BigNumber(res[7]).dividedBy(decimal).toFixed(6),
                ticketBalance: new BigNumber(res[8]).dividedBy(decimal).toFixed(6),
                star: parseInt(new BigNumber(res[9]).toString(10)),
                isKing: res[10],
            };

            that.callMethod("detailsOfIncome", [], function (detailsOfIncome) {
                detail["detailsOfIncome"] = detailsOfIncome;
                that.setState({
                    ct_details: detail
                })
            });
        });
    }

    getPoolBalance() {
        let that = this;
        let res = that.callMethod("poolBalance", [], function (res) {
            that.setState({
                poolBalance: new BigNumber(res).dividedBy(decimal).toFixed(6)
            })
        });
    }

    getTopTenInfo() {
        let that = this;
        let res = that.callMethod("topTenInfo", [], function (res) {
            let items = []
            if (res[0] != "") {
                let codes = res[0].split(",");
                codes.forEach((each, index) => {
                    items.push({code: each, value: res[1][index], recommentAmount: res[4][index]});
                });

                items.sort((a, b) => {
                    return new BigNumber(b.value).comparedTo(new BigNumber(a.value));
                })
            }
            let topTenInfo = {
                items: items,
                totalReward: new BigNumber(res[2]).dividedBy(decimal).toFixed(2),
                preTotalReward: new BigNumber(res[3]).dividedBy(decimal).toFixed(2),
            };
            that.setState({
                topTenInfo: topTenInfo
            })
        });
    }

    getRate() {
        let that = this;
        that.callMethod("conversionRate", [], function (res) {
            that.setState({ct_rate: new BigNumber(res).dividedBy(10).toFixed(2)});
        });
    }

    callMethod(_method, args, callback) {

        let packData = contract.packData(_method, args);
        let callParams = {
            from: this.state.currentAccount.MainPKr,
            to: contractAddress,
            data: packData
        };

        seropp.call(callParams, function (callData) {
            // let callData = pullup.sero.call(callParams, "latest");
            let res = contract.unPackData(_method, callData);
            callback(res);
        });
    }

    executeMethod(_method, args, value, cy, callback) {
        let that = this;

        let packData = contract.packData(_method, args);
        let executeData = {
            from: that.state.currentAccount.PK,
            to: contractAddress,
            value: "0x" + value,//SERO
            data: packData,
            gas_price: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };
        let estimateParam = {
            from: that.state.currentAccount.MainPKr,
            to: contractAddress,
            value: "0x" + value,//SERO
            data: packData,
            gas_price: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };

        seropp.estimateGas(estimateParam, function (gas, err) {
            if (err) {
                message.error(err.message);
                return;
            }
            executeData["gas"] = gas;
            // let res = pullup.local.executeContract(executeData)
            seropp.executeContract(executeData, function (res) {
                callback(res);
            });
        });
    }


    handleCancel = () => {
        this.setState({
            showDeposit: false
        })
    }

    //====  Invest begin
    handleInvestCancel = () => {
        this.setState({showInvest: false});
    };

    handleInvestCreate = (cb) => {
        let that = this;
        const {form} = this.formRef2.props;
        form.validateFields((err, values) => {
            if (err) {
                if (cb) {
                    cb(false)
                }
                return;
            }
            let amount;
            if (this.state.investCurrency == "SERO") {
                amount = form.getFieldValue("AmountSero");
            } else {
                amount = form.getFieldValue("AmountTicket");
            }
            let referId = form.getFieldValue("ReferId");
            if (that.state.ct_details.referId) {
                referId = that.state.ct_details.referId;
            }
            let availableAmount = this.state.investCurrency == "SERO" ? that.state.balanceSero : that.state.balanceTicket;
            if (new BigNumber(amount).comparedTo(new BigNumber(availableAmount)) > 0) {
                if (cb) {
                    cb(false)
                }
                message.warn(<span style={{color: "#0f585b"}}>{Lang[that.state.lang].toast.lessAmount}</span>);
            } else {
                try {
                    that.executeMethod("invest", [referId, that.state.currentAccount.MainPKr], new BigNumber(amount).multipliedBy(decimal).toString(16), that.state.investCurrency, function (res) {
                        if (res) {
                            form.resetFields();
                            that.setState({showInvest: false});
                            // setTimeout(function () {
                            openNotificationWithIcon('success', 'Successful', `${Lang[that.state.lang].toast.tx}${res}`)
                            // }, 3000)
                        }
                        if (cb) {
                            cb(false)
                        }
                    });
                } catch (err) {
                    if (cb) {
                        cb(false)
                    }
                }
            }
        });
    };

    saveInvestFormRef = formRef => {
        this.formRef2 = formRef;
    };

    //====  Invest end

    shareProfit() {
        let that = this;
        try {
            this.executeMethod("triggerStaticProfit", [], "0", "SERO", function (res) {
                if (res) {
                    openNotificationWithIcon('success', 'Successful', `${Lang[that.state.lang].toast.tx}${res}`)
                } else {
                }
            });
        } catch (err) {
        }

    }

    withdraw() {
        let that = this;
        try {
            this.executeMethod("withdrawBalance", [], "0", "SERO", function (res) {
                if (res) {
                    openNotificationWithIcon('success', 'Successful', `${Lang[that.state.lang].toast.tx}${res}`)
                } else {
                }
            });
        } catch (err) {
        }
    }

    //==== Buy Ticket end

    render() {

        const {loading, showAccountSelect, currentAccount} = this.state;
        let accountName = currentAccount.MainPKr;
        let that = this;

        let canWithdrawBalance = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[0]).dividedBy(decimal).toFixed(2) : 0;
        let withdrawTimestamp = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[1]).toNumber() : 0;
        let dayProfit = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[2]).dividedBy(decimal).toFixed(2) : 0;
        let staticReward = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[3]).dividedBy(decimal).toFixed(2) : 0;
        let recommendReward = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[4]).dividedBy(decimal).toFixed(2) : 0;
        let nobilityReward = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[5]).dividedBy(decimal).toFixed(2) : 0;
        let vipReward = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[6]).dividedBy(decimal).toFixed(2) : 0;

        let staticTimestamp = that.state.ct_details.detailsOfIncome ? that.state.ct_details.detailsOfIncome[7] : 0;

        const salesPieData = [
            {
                x: Lang[this.state.lang].account.title.staticReward,
                y: parseFloat(staticReward),
            },
            {
                x: Lang[this.state.lang].account.title.recommendReward,
                y: parseFloat(recommendReward),
            },
            {
                x: Lang[this.state.lang].account.title.nobilityReward,
                y: parseFloat(nobilityReward),
            },
            {
                x: Lang[this.state.lang].account.title.vipReward,
                y: parseFloat(vipReward),
            },

        ];

        const showChart = parseFloat(staticReward) > 0 || parseFloat(recommendReward) > 0 || parseFloat(nobilityReward) > 0 || parseFloat(vipReward) > 0
        let totalReturnDay = this.state.poolBalance ? new BigNumber(this.state.poolBalance).dividedBy(30).toFixed(6) : "0";
        let returnPercent = 0;
        if (this.state.ct_details.returnAmount && parseFloat(this.state.ct_details.returnAmount) > 0) {
            let a = parseFloat(this.state.ct_details.returnAmount);
            let b = new BigNumber(this.state.ct_details.amount).multipliedBy(5).toString(10);
            returnPercent = (a * 100 / parseFloat(b)).toFixed(2);
        }

        // const countDown = new Date(staticTimestamp*1000).getTime() + 24*60*60*1000;
        const countDown = new Date(staticTimestamp * 1000).getTime() + 10 * 60 * 1000;
        let showCountDown = countDown > new Date().getTime();

        let nextWithdrawTime = (withdrawTimestamp + 30 * 60) * 1000;

        let topsHtml;
        if (that.state.topTenInfo && that.state.topTenInfo.items.length > 0) {
            topsHtml = that.state.topTenInfo.items.map((item, index) => {
                return <Row style={{textAlign: 'center'}} key={index}>
                    <Col span={6}><span>{index + 1}</span></Col>
                    <Col span={6}><span>{item.code.slice(0, 5) + "..." + item.code.slice(-2)}</span></Col>
                    <Col
                        span={6}><span>{new BigNumber(item.value).dividedBy(decimal).toFixed(2)}</span></Col>
                    <Col
                        span={6}><span>{new BigNumber(item.recommentAmount).dividedBy(decimal).toFixed(2)}</span></Col>
                </Row>
            })
        }

        console.log("ct_details", that.state.ct_details);

        return (
            <div className="App">
                <Content>
                    <div style={{background: '#000', minHeight: document.body.clientHeight}}>

                        <div style={{padding: "15px"}}>
                            <List itemLayout="vertical" size="large" rowKey="1">
                                <List.Item>
                                    <Skeleton loading={loading} avatar>
                                        <div>
                                            <h1 className="text-center"><img src={li} className="fire-icon"/>
                                                <span>{Lang[this.state.lang].account.title.utxo}</span></h1>
                                        </div>
                                        <div className="content-border">
                                            <div>
                                                <List.Item.Meta
                                                    title={
                                                        <Row>
                                                            <Col span={16}>
                                                                <small>
                                                                    {currentAccount.Name} {accountName ? accountName.slice(0, 6) + "..." + accountName.slice(-6) : ""}{this.state.ct_details.isKing ?
                                                                    <Tag color="gold">VIP</Tag> : ""}
                                                                </small>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Button size="small" type="link" onClick={() => {
                                                                    this.setState({
                                                                        showAccountSelect: true
                                                                    })
                                                                }}><span
                                                                    style={{fontSize: '16px'}}>{Lang[this.state.lang].account.title.swith}</span></Button>
                                                            </Col>
                                                        </Row>
                                                    }
                                                    description={<Rate count={4}
                                                                       value={this.state.ct_details.star ? this.state.ct_details.star : 0}
                                                                       disabled/>}
                                                />
                                            </div>
                                            <Row style={{textAlign: 'center'}}>
                                                <Col span={12}>
                                                    <Statistic title={Lang[this.state.lang].account.title.balanceSero}
                                                               value={this.state.balanceSero} precision={6}/>
                                                    <Button style={{marginTop: 16}} type="primary" onClick={() => {
                                                        this.showDeposit()
                                                    }}>{Lang[this.state.lang].account.button.deposit}</Button>
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic title={Lang[this.state.lang].account.title.balanceTicket}
                                                               value={this.state.balanceTicket} precision={6}/>
                                                    <Button style={{marginTop: 16}} type="primary" onClick={() => {
                                                        this.showDeposit()
                                                    }}>{Lang[this.state.lang].account.button.deposit}</Button>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Skeleton>
                                </List.Item>

                                <List.Item>
                                    <Skeleton loading={loading}>
                                        <div>
                                            <h1 className="text-center"><img src={li} className="fire-icon"/>
                                                <span>{Lang[this.state.lang].account.title.contract}</span></h1>
                                        </div>
                                        <div className="content-border">
                                            <Row style={{textAlign: 'center'}}>
                                                <Col span={24}>
                                                    <Statistic
                                                        title={Lang[this.state.lang].account.title.estimatedTotal}
                                                        value={new BigNumber(this.state.ct_details.amount ? this.state.ct_details.amount : 0).multipliedBy(5).toFixed(6)}
                                                        precision={6}/>
                                                </Col>
                                            </Row>

                                            <Row style={{textAlign: 'center'}}>
                                                <Col span={12}>
                                                    <Statistic title={Lang[this.state.lang].account.title.availableSero}
                                                               value={new BigNumber(this.state.ct_details.seroBalance ? this.state.ct_details.seroBalance : 0).toFixed(6)}
                                                               precision={6}/>
                                                    <Button style={{marginTop: 16}} type="primary" onClick={() => {
                                                        this.setState({showInvest: true, investCurrency: "SERO"})
                                                    }}>{Lang[this.state.lang].account.button.invest}</Button>
                                                </Col>

                                                <Col span={12}>
                                                    <Statistic
                                                        title={Lang[this.state.lang].account.title.availableTicket}
                                                        value={new BigNumber(this.state.ct_details.ticketBalance ? this.state.ct_details.ticketBalance : 0).toFixed(6)}
                                                        precision={6}/>
                                                    <Button style={{marginTop: 16}} type="primary" onClick={() => {
                                                        this.setState({showInvest: true, investCurrency: "GAIL"})
                                                    }}>{Lang[this.state.lang].account.button.deposit}</Button>
                                                </Col>

                                            </Row>

                                            <Row style={{textAlign: 'center'}}>
                                                <p/>
                                                <Col span={12}>
                                                    <Statistic title={Lang[this.state.lang].account.title.staticIncome}
                                                               value={dayProfit} precision={6}/>
                                                    {
                                                        showCountDown ?
                                                            <Countdown style={{marginTop: 14}} title=""
                                                                       format="HH:mm:ss"
                                                                       value={parseFloat(countDown)} onFinish={() => {
                                                                this.getDetail()
                                                            }}/> : <Button style={{marginTop: 16}} type="primary"
                                                                           disabled={showCountDown} onClick={() => {
                                                                this.shareProfit()
                                                            }}>{Lang[this.state.lang].account.button.trigger}</Button>
                                                    }
                                                </Col>

                                                <Col span={12}>
                                                    <Statistic title={Lang[this.state.lang].account.title.withdraw}
                                                               value={new BigNumber(canWithdrawBalance).toFixed(6)}
                                                               precision={6}/>

                                                    {
                                                        nextWithdrawTime > new Date().getTime() ?
                                                            <Countdown style={{marginTop: 14}} title=""
                                                                       format="HH:mm:ss"
                                                                       value={parseFloat(nextWithdrawTime)}
                                                                       onFinish={() => {
                                                                           this.getDetail()
                                                                       }}/> : <Button style={{marginTop: 16}}
                                                                                      disabled={new BigNumber(canWithdrawBalance).comparedTo(0) < 1}
                                                                                      type="primary" onClick={() => {
                                                                this.withdraw()
                                                            }}>{Lang[this.state.lang].account.button.withdraw}</Button>
                                                    }

                                                </Col>
                                            </Row>

                                            {
                                                showChart ?
                                                    <Row style={{textAlign: 'center'}}>

                                                        <Col span={12} style={{textAlign: 'left'}}>
                                                            <Pie
                                                                hasLegend
                                                                animate
                                                                title={Lang[this.state.lang].account.title.totalReturn}
                                                                subTitle={Lang[this.state.lang].account.title.totalReturn}
                                                                total={() => (
                                                                    <span
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: salesPieData.reduce((pre, now) => now.y + pre, 0),
                                                                        }}
                                                                    />
                                                                )}
                                                                data={salesPieData}
                                                                valueFormat={val => <span
                                                                    dangerouslySetInnerHTML={{__html: val}}/>}
                                                                height={248}
                                                            />
                                                        </Col>
                                                        <Col span={12} style={{textAlign: 'center', padding: '5px'}}>
                                                            <div>
                                                                {returnPercent > 0 ? <WaterWave height={234}
                                                                                                title={Lang[this.state.lang].account.title.totalReturn}
                                                                                                percent={returnPercent}/> :
                                                                    <WaterWave height={234}
                                                                               title={Lang[this.state.lang].account.title.totalReturn}
                                                                               percent={0}/>}
                                                            </div>
                                                        </Col>
                                                    </Row> : ""
                                            }
                                            <Divider dashed={true}/>

                                            <Row style={{textAlign: 'center'}}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title={Lang[this.state.lang].account.title.totalReturnDay}
                                                        value={totalReturnDay} precision={6}/>
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic title={Lang[this.state.lang].account.title.dayIncome}
                                                               value={
                                                                   totalReturnDay == "0" ? 0 :
                                                                       new BigNumber(dayProfit).multipliedBy(100).dividedBy(totalReturnDay).toFixed(2)}
                                                               suffix={"%"}/>
                                                </Col>

                                            </Row>

                                            <Row style={{textAlign: 'center'}}>
                                                <p/>
                                                <Col span={12}>
                                                    <Statistic title={Lang[this.state.lang].account.title.areaTotal}
                                                               value={this.state.ct_details.largeAreaTotal}
                                                               precision={6}/>
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title={Lang[this.state.lang].account.title.areaOtherTotal}
                                                        value={new BigNumber(this.state.ct_details.achievement).minus(new BigNumber(this.state.ct_details.largeAreaTotal)).toFixed(6)}
                                                        precision={6}/>
                                                </Col>
                                            </Row>

                                            <Divider dashed={true}/>
                                        </div>
                                    </Skeleton>
                                </List.Item>

                                <List.Item>
                                    <Skeleton loading={loading}>
                                        <div>
                                            <h1 className="text-center"><img src={li} className="fire-icon"/>
                                                <span>{Lang[this.state.lang].account.topTen.title}</span>
                                                <br/><span
                                                    style={{fontSize: '14px'}}>{Lang[this.state.lang].account.topTen.title1}:{this.state.topTenInfo.totalReward ? this.state.topTenInfo.totalReward : 0} SERO</span>
                                            </h1>
                                        </div>
                                        <div className="content-border">
                                            <Row style={{textAlign: 'center'}}>
                                                <Col span={24}><span>{Lang[this.state.lang].account.topTen.title2}</span></Col>
                                            </Row>
                                            <Row style={{textAlign: 'center'}}>
                                                <Col
                                                    span={6}><span>{Lang[this.state.lang].account.topTen.rank}</span></Col>
                                                <Col
                                                    span={6}><span>{Lang[this.state.lang].account.topTen.code}</span></Col>
                                                <Col span={6}><span>{Lang[this.state.lang].account.topTen.reward}</span></Col>
                                                <Col
                                                    span={6}><span>{Lang[this.state.lang].account.topTen.achievement}</span></Col>
                                            </Row>
                                            {topsHtml}
                                        </div>
                                    </Skeleton>
                                </List.Item>

                                <List.Item>
                                    <Skeleton loading={loading}>
                                        <div className="content-border2">
                                            <Descriptions title={<h1>{Lang[this.state.lang].project.title}</h1>}>
                                                <Descriptions.Item
                                                    label={Lang[this.state.lang].project.contractAddress}>
                                                    <small>{contractAddress}</small>
                                                </Descriptions.Item>
                                            </Descriptions>

                                            <Row>
                                                <Col span={16}>
                                                    <Statistic title={Lang[this.state.lang].project.rate}
                                                               value={this.state.ct_rate} precision={2}
                                                               valueStyle={{color: '#3f8600'}}/>
                                                </Col>
                                            </Row>
                                            <Divider dashed={true}/>
                                            <Descriptions title={Lang[this.state.lang].account.title.investDetail}>
                                                <Descriptions.Item
                                                    label={Lang[this.state.lang].account.title.id}>{this.state.ct_details.id}</Descriptions.Item>
                                                <Descriptions.Item
                                                    label={Lang[this.state.lang].account.title.referId}>{this.state.ct_details.referId}</Descriptions.Item>
                                                <Descriptions.Item
                                                    label={Lang[this.state.lang].account.title.areaId}>{this.state.ct_details.largeAreaId}</Descriptions.Item>
                                                <Descriptions.Item
                                                    label={Lang[this.state.lang].account.title.totalInvest}>{this.state.ct_details.amount}</Descriptions.Item>
                                                <Descriptions.Item
                                                    label={Lang[this.state.lang].account.title.profitLevel}>5</Descriptions.Item>
                                                <Descriptions.Item
                                                    label={Lang[this.state.lang].account.title.latestTime}>{convertUTCDate(staticTimestamp)}</Descriptions.Item>
                                            </Descriptions>
                                        </div>
                                    </Skeleton>
                                </List.Item>

                            </List>
                        </div>
                        <div className="footer-n" style={{textAlign:'center',color:'white'}}>
                            <div>开源地址：https://github.com/gail-com-de/gail</div>
                        </div>
                    </div>
                </Content>

                <SelectAccount visible={showAccountSelect} selectAccount={this.selectAccount}
                               hiddenAccount={this.hiddenAccount}/>

                <Modal
                    title={Lang[this.state.lang].account.modal.deposit.title}
                    visible={this.state.showDeposit}
                    onCancel={this.handleCancel}
                    footer={null}
                    getContainer={false}
                >
                    <div style={{textAlign: "center"}}>
                        <canvas id="qrImg"></canvas>
                        <p style={{wordBreak: 'normal', whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>
                            <small style={{color: "#0f585b"}}>{this.state.currentAccount.MainPKr}</small></p>
                        <Button className='copyTxt' type={"primary"} onClick={() => {
                            copy(this.state.currentAccount.MainPKr);
                            message.success(<span style={{color: "#0f585b"}}>Copy to clipboard successfully</span>);
                        }}>{Lang[this.state.lang].account.modal.deposit.copy}</Button>
                    </div>
                </Modal>

                <InvestForm
                    wrappedComponentRef={this.saveInvestFormRef}
                    visible={this.state.showInvest}
                    onCancel={this.handleInvestCancel}
                    onCreate={this.handleInvestCreate}
                    balanceSero={this.state.balanceSero}
                    balanceTicket={this.state.balanceTicket}
                    availableSero={this.state.ct_details.seroBalance}
                    availableTicket={this.state.ct_details.ticketBalance}
                    rate={this.state.ct_rate}
                    lang={this.state.lang}
                    times={this.state.ct_details.profitLevel}
                    referId={this.state.ct_details.referId}
                    investCurrency={this.state.investCurrency}
                />
            </div>
        );
    }
}


class App extends Component {
    constructor() {
        super();
        this.state = {
            lang: "zh_CN",
        };
    }

    componentWillMount() {
        let that = this;
        seropp.getInfo(function (info) {
            that.setState({
                lang: info.language,
            })
        });
    }

    showRules = () => {
        let that = this;
        Modal.info({
            title: <span style={{color: "#f3ba44", fontWeight: "600"}}>{Lang[that.state.lang].project.rule}</span>,
            okText: "OK",
            icon: "",
            content: <div>
                <span style={{'whiteSpace': 'pre-wrap', color: "#FFFFFF"}}>{Lang[that.state.lang].toast.rule}</span>
                <a className='copyTxt' onClick={() => {
                    copy("IFVUSKIRFSIDF");
                    message.success('Copy to clipboard successfully');
                }}>{Lang[this.state.lang].account.modal.deposit.copy}</a>
                <br/>
            </div>
        })
    }

    render() {
        const {locale} = this.state;
        return (
            <div className="App">
                <Layout className="layout">
                    <ConfigProvider locale={locale}>
                        <div>
                            <img src={head} width={"100%"}/>
                            {/*<span style={{*/}
                            {/*    float: "left",*/}
                            {/*    position: "absolute",*/}
                            {/*    top: "20px",*/}
                            {/*    left: "15px",*/}
                            {/*    color: 'rgb(243, 186, 68)',*/}
                            {/*    fontWeight: "600"*/}
                            {/*}} onClick={this.showRules.bind(this)}>{Lang[this.state.lang].project.rule}</span>*/}
                        </div>
                        <ContentPage key={locale ? locale.locale : 'en'}/>
                    </ConfigProvider>
                    {/*<Footer style={{textAlign: 'center', background: '#000'}}/>*/}
                </Layout>
            </div>
        );
    }
}

function convertUTCDate(dateTimestamp) {
    if (dateTimestamp && dateTimestamp > 0) {
        let cDate = new Date(dateTimestamp * 1000);
        return appendZero(cDate.getMonth() + 1) + "/" + appendZero(cDate.getDate()) + " " + appendZero(cDate.getHours()) + ":" + appendZero(cDate.getMinutes());
    }
    return ""
}

function appendZero(i) {
    i = i < 10 ? "0" + i : i;
    return i;
}

export default App;

